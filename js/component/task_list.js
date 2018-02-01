import { db_connection } from "../main.js";
import Task from "./a_task.js";

export default class TaskList extends HTMLElement {

    static get template() {

        return document.getElementById( "task-list-template" ).content.cloneNode( true );
    }

    constructor() {
        super();
        
        // this.tasks = [];
        this.item_per_page = 10;
        this.last_index = 1;

        this.appendChild( TaskList.template );

        this.tasks_dom = this.querySelector( "#tasks" );

        // this.more_button = this.querySelector( "#more" );
        // this.more_button.addEventListener( "click", (event) => {

        //     this.add_page(); 
        // });

        this.add_page();
    }

    add_task( new_task ) {

        // this.tasks.push( new_task );
        this.tasks_dom.appendChild( new Task( new_task ) );
    }

    add_task_in_order( new_task ) {

        for( const task of this.tasks ) {


        }
    }

    add_page() {
/* 
        const task_range = {
            begin : this.last_index,
            end : this.last_index + this.item_per_page
        }

        db_connection.send( "get_range", task_range, (response) => {

            if( response.length < this.item_per_page ) {

                this.more_button.setAttribute( "disabled", "" );
            }

            response.map( (task) => this.add_task( task ) );
        });
 */


        const query = {
            qualifier : `(task) => {
                return task.archived == false;
            }`,
            index : "due_to",
            order : "next"
        }

        console.log( query );

        db_connection.send( "get_match", query, (response) => {

            if( response == false  ||  response instanceof Error ) {

                console.warn( "Request failed", response );
                return;
            }

            response.map( (task) => this.add_task( task ) );
        });

        this.last_index += this.item_per_page;
    }
}

customElements.define( "task-list", TaskList );