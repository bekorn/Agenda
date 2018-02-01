import Connection from "./communicator.js";
import NewTask from "./component/new_task.js";
import TaskList from "./component/task_list.js";
import Task from "./component/a_task.js";


export let task_list;
const db_worker = new Worker( "js/db_worker.js" );
export const db_connection = new Connection( db_worker );


window.addEventListener( "load", () => {

    console.log( "window loaded" );

    task_list = new TaskList();
    document.getElementById( "task_list" ).appendChild( task_list );

    // get_notification_permision();
    // init_service_worker();
});


function get_notification_permision() {

    if( Notification.permission == "denied" ) {

        throw new Error( "This app requires notification permissions to work!" );
    }
    else if( Notification.permission == "default" ) {
    
        Notification.requestPermission().then( result => {
    
            if( result != "granted" ) {
    
                throw new Error( "This app requires notification permissions to work!" );
            }
        });
    }
}


function init_service_worker() {

    if( ! 'serviceWorker' in navigator ) {

        throw new Error( "Your browser does not support Service Workers, please update it." );
    }

    const file = "service_worker.js";

    function success( registration ) {

        console.log( "Registered the ServiceWorker" );
    }

    function failure( error ) {

        console.log( "Failed to register the ServiceWorker", error );
    }

    navigator.serviceWorker.register( file ).then( success, failure );
}



/*
if( navigator.onLine ) {

    console.log( "You have connection" );
}
else {

    console.log( "You don't have a connection!" );

    event.respondWith( fetch("offline.html") );
}
*/