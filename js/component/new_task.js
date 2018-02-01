import { db_connection, task_list } from "../main.js";

export default class NewTask extends HTMLElement {

    static get template() {

        return document.getElementById( "new-task-template" ).content.cloneNode( true );
    }

    constructor() {

        super();

        this.appendChild( NewTask.template );

        this.submit_button = this.querySelector( "#add" );
        this.summary = this.querySelector( "#summary" );
        this.description = this.querySelector( "#description" );
        this.datetime = this.querySelector( "#datetime" );
        const now = new Date();
        const local_now = new Date( now.getTime() + (now.getTimezoneOffset()*1000*60) );
        this.datetime.value = local_now.toISOString().substring(0, 16);

        this.submit_button.addEventListener( "click", (event) => {

            this.submit_button.blur();

            this.add_task();
        });
    }

    get_data() {

        return {
            summary : this.summary.value.trim(),
            description : this.description.value.trim(),
            due_to : new Date( this.datetime.value )
        }
    }

    add_task() {

        const data = this.get_data();

        db_connection.send( "add", data, (response) => {

            if( response instanceof Error ) {
                //  db error
                console.warn( "Failed to Save Task" );
            }
            else if( response == false ) {
                //  Data failed validation
                console.warn( "Validation Error", response );
				
                //  TODO: Show/Handle validation error properly
                alert("Please fill all the fields");
            }
            else {
                //  Task saved to db
                console.log( "Saved Task", response );

                task_list.add_task( response );
            }
        });
    }
}

customElements.define( "new-task", NewTask );