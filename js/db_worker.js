console.log( "DB worker running" );

let db, db_request;

const db_name = "AgendaDB";
const store_name = "tasks";

init();

function init() {

    db_request = indexedDB.open( db_name, 1 );

    //  First time requesting this db
    db_request.addEventListener( "upgradeneeded", init_db );

    //  Getting an already existing db
    db_request.addEventListener( "success", get_db );

    //  Permission not given for indexedDB
    db_request.addEventListener( "error", () => {

        throw new Error( "IndexedDB permission is missing" );
    });
}

function init_db( event ) {

    console.log( "IndexedDB upgraded" );

    db = event.target.result;

    const store = db.createObjectStore( store_name, { keyPath : "id", autoIncrement : true } );

    store.createIndex( "summary", "summary", { unique : false } );
    store.createIndex( "description", "description", { unique : false } );
    store.createIndex( "due_to", "due_to", { unique : false } );
    store.createIndex( "archived", "archived", { unique : false } );
    store.createIndex( "created_at", "created_at", { unique : false } );

    store.transaction.addEventListener( "complete", store_ready );
}

function get_db( event ) {

    console.log( "IndexedDB successful" );

    //  Might be comming from an upgradeneeded event, hence no need to set db again
    db = db  ||  event.target.result;
}

function store_ready() {

    console.log( "Store ready" );
}


self.addEventListener( "error", (event) => {

    console.error( "DB_Worked catched an error:\n", event.error );

    event.preventDefault();
    event.stopPropagation();
});


self.addEventListener( "messageerror", (error) => {

    console.log( "messageerror", error );
});


self.addEventListener( "message", (event) => {

    // console.log( "Message received", event );

    const message = event.data;

    if( ! is_formatted( message ) ) {

        throw new Error( "Message not formatted", message );
    }

    if( ! (message.job in self.jobs) ) {

        throw new Error( "Unknown task requested", message );
    }

    if( db == undefined ) {
        //  The request shuld be defered
        db_request.addEventListener( "success", () => {
            resolve_request( message.sender, message.job, message.data );
        });

        return;
    }

    resolve_request( message.sender, message.job, message.data );
});

function is_formatted( message ) {

    if( ! message  ||  ! ('data' in message)  ||  ! ('sender' in message)  ||  ! ('job' in message) ) {
        return false;
    }

    return true;
}

//  Puts data into an agreed format
function format( sender, data ) {
    return {
        sender : sender,
        data : data
    };
}

async function resolve_request( sender, job, data ) {

    const result = await self.jobs[ job ]( data );

    const response = format( sender, result );

    self.postMessage( response );
}


/*  Jobs   */

self.jobs = {
    "add" : (data) => validate(data, ["summary","description","due_to"])  &&  add(data),

    "get_single" : (data) => validate(data, ["id"])  &&  get_single(data),
    "get_range" : (data) => validate(data, ["begin","end"])  &&  get_range(data),
    "get_match" : (data) => validate(data, ["qualifier","index","order"])  &&  get_match(data),

    "update" : (data) => validate(data, ["id"])  &&  update(data),
}

function validate( data, requirements ) {

    if( requirements == undefined ) {

        for( const key in data ) {
        
            if( ! data[ key ]  ||  data[ key ].toString().trim().length == 0 ) {
                return false;
            }
        }
    }
    else {

        for( const key of requirements ) {
        
            if( ! (key in data)  ||  ! data[ key ]  ||  data[ key ].toString().trim().length == 0 ) {
                return false;
            }
        }
    }

    return true;
}

function new_task_entry( summary, description, due_to ) {

    return {
        summary : summary,
        description : description,
        due_to : due_to,
        archived : false,
        created_at : Date.now()
    };
}

function new_transaction( access_mode ) {

    const transaction = db.transaction( [store_name], access_mode );

    transaction.addEventListener( "complete", (event) => {

        console.log( "DB whole transaction completed" );
    });

    transaction.addEventListener( "error", (event) => {

        console.warn( "DB transaction error", event );
    });

    return transaction;
}

async function new_request( request, success, error ) {

    return new Promise( (resolve, reject) => {

        request.addEventListener( "success", (event) => {

            // console.log( "DB single transaction (" + type + ") completed" );

            if( success  &&  typeof success == "function" ) {

                resolve( success( event.target.result ) );
            }

            resolve( event.target.result );
        });

        request.addEventListener( "error", error  ||  ((event) => {

            // console.warn( "DB single transaction (" + type + ") failed!" );

            if( error  &&  typeof error == "function" ) {

                resolve( error( event.target.result ) );
            }

            reject( new Error( "DB request fault", event.target.result ) );
        }) );
    });
}

async function add( task ) {

    const transaction = new_transaction( "readwrite" );

    const store = transaction.objectStore( store_name );
    
    const task_entry = new_task_entry( task.summary, task.description, task.due_to );

    return new_request( store.add( task_entry ), (result) => {

        task_entry.id = result;
        return task_entry;
    } );
}

async function get_single( id ) {

    const transaction = new_transaction( "readonly" );

    const store = transaction.objectStore( store_name );

    return new_request( store.get( id ) );
}

async function get_range( range ) {

    const transaction = new_transaction( "readonly" );
    const store = transaction.objectStore( store_name );

    const results = [];

    const cursor_range = IDBKeyRange.bound( range.begin, range.end );
    const cursor_request = store.openCursor( cursor_range );
    
    return new Promise( (resolve, reject) => {

        cursor_request.addEventListener( "success", (event) => {

            const cursor = event.target.result;
    
            if( cursor ) {
    
                console.log( "Cursor value",cursor );
                results.push( cursor.value );
                cursor.continue();
            }
            else {

                console.log( "cursor finished" );
                resolve( results );
            }
        });
    });
}

async function get_match( query ) {

    const transaction = new_transaction( "readonly" );
    const store = transaction.objectStore( store_name );
    const results = [];

    let cursor_request;

    if( query.index == "id" ) {

        cursor_request = store.openCursor();
    }
    else {

        let valid_index = false;
        for( const index of store.indexNames ) {

            if( query.index == index ) {

                valid_index = true;
                break;
            }
        }

        if( ! valid_index ) {

            return new Error( "index of query is not valid", query );
        }

        const index = store.index( query.index );
        cursor_request = index.openCursor();
    }

    //  ! TODO: FIND A WORKAROUND INSTEAD OF EVAL
    query.qualifier = eval( query.qualifier );

    if( typeof query.qualifier != "function" ) {

        return new Error( "get_match requires a qualifier function to work. Insted got", query.qualifier );
    }


    return new Promise( (resolve, reject) => {

        cursor_request.addEventListener( "success", (event) => {

            const cursor = event.target.result;
    
            if( cursor ) {
    
                console.log( "Cursor value",cursor );

                if( query.qualifier( cursor.value ) ) {

                    results.push( cursor.value );
                }

                cursor.continue();
            }
            else {

                console.log( "cursor finished" );
                resolve( results );
            }
        });
    });
}

async function update( data ) {

    const transaction = new_transaction( "readwrite" );

    const store = transaction.objectStore( store_name );


    const task_entry = await new_request( store.get( data.id ) );

    if( task_entry instanceof Error  ||  task_entry == false ) {

        return task_entry;
    }

    //  Put new data in the task
    for( const key in task_entry ) {

        if( key in data ) {

            task_entry[ key ] = data[ key ];
        }
    }

    console.log( "Updated task_entry", task_entry );

    if( ! validate( task_entry ) ) {

        return new Error( "Updated task does not validate" );
    }


    return new_request( store.put( task_entry ), (result) => {

        return( task_entry );
    });
}