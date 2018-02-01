
export default class Connection {

    constructor( worker ) {

        if( worker == undefined ) {

            throw new Error( "Connection object must take a worker" );
        }

        this.worker = worker;
    }

    //  Sends a message to worker and recieves only one message
    send( job, data, resolver ) {

        //  Create message format
        const message = Connection.format( job, data );

        //  Create a listener
        const listener = ( event ) => {

            const message_recieved = event.data;

            if( message_recieved.sender != message.sender ) {
                return; //  Discard this message, it is not for you
            }

            resolver( message_recieved.data );

            //  Remove this listener becasue it shouldn't listen any other messages
            this.worker.removeEventListener( "message", listener );
        }

        //  Add the listener
        this.worker.addEventListener( "message", listener );

        //  Send message
        this.worker.postMessage( message );
    }

    //  Puts data into an agreed format
    static format( job, data ) {
        return {
            sender : Date.now() + Math.random(),
            job : job,
            data : data
        };
    }
    
}