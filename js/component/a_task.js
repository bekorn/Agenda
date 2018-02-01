import { db_connection } from "../main.js";

export default class Task extends HTMLElement {

    static get template() {

        return document.getElementById( "a-task-template" ).content.cloneNode( true );
    }

    static get invalid_task() {
        
        return {
            'id' : -1,
            'archived' : false,
            'summary' : "Error: Invalid Task",
            'description' : "Sorry for showing you one of these :/",
            'created_at' : 0,
            'due_to' : 0,
        }
    }

    constructor( task_entry ) {
        super();

        if( ! Task.is_valid_task( task_entry ) ) {

            console.warn( "Task should be created with proper data. Instead got", task_entry );

            task_entry = Task.invalid_task;
        }

        this.task = task_entry;
        this.due_to_date = new Date( this.task.due_to );

        this.appendChild( Task.template );

        this.summary = this.querySelector( "p" );
        this.description = this.querySelector( ".description" );
        this.due_to = this.querySelector( ".due_to" );
        this.created_at = this.querySelector( ".created_at" );

        
        this.pin_button = this.querySelector( "#pin" );
        this.pin_button.addEventListener( "click", () => console.log( "Pinned " + this.task.id ) );
        
        this.copy_button = this.querySelector( "#copy" );
        this.copy_button.addEventListener( "click", () => console.log( "Copied " + this.task.id ) );
        
        this.edit_button = this.querySelector( "#edit" );
        this.edit_button.addEventListener( "click", () => console.log( "Edited " + this.task.id ) );

        this.done_button = this.querySelector( "#done" );
        this.done_button.addEventListener( "click", () => this.archive_task() );


        this.update_element();
        
        if( this.task.archived ) {

            this.arcihve_element();
        }
    }

    update_element() {

        this.summary.textContent = this.task.summary;
        
        const remaining_ms = this.due_to_date - Date.now();
        const remaining_hours = remaining_ms / (1000 * 60 * 60);
        const remaining_days = Math.ceil( remaining_hours / 24 );

        this.timed_out = remaining_ms <= 0;

        let options;
        if( remaining_days <= 7 ) {

            options = { minute: "2-digit", hour : "2-digit", weekday : "long" };
        }
        else {

            options = { minute: "2-digit", hour : "2-digit", day : "numeric", month : "long" };
        }

        this.due_to.textContent = "🕒" + this.due_to_date.toLocaleString( navigator.languages[0], options );
        this.due_to.setAttribute( "time",  this.task.due_to );
        this.due_to.setAttribute( "title",  this.due_to_date.toLocaleString( navigator.languages[0] ) );

        // const created_at = new Date( this.task.created_at );
        // this.created_at.textContent = "@" + created_at.toLocaleDateString( navigator.languages[0] );
        // this.created_at.setAttribute( "time",  created_at.toUTCString() );

        this.description.textContent = this.task.description;


        
        if( ! this.task.archived ) {

            if( this.timed_out ) {

                this.setAttribute( "timed-out", "" );

                this.due_to.textContent += " ❌";
            }
            else if( remaining_hours < 12 ) {

                this.due_to.textContent += " ❗❗";
            }
            else if( remaining_days < 2 ) {
    
                this.due_to.textContent += " ❗";
            }
            // else if( remaining_hours < 24 ) {
    
            //     this.due_to.textContent += " ⏰";
            // }
        }
    }

    static is_valid_task( task ) {

        if( ! task  ||  typeof task != "object"
        ||  ! ('id' in task)
        ||  ! ('summary' in task)
        ||  ! ('description' in task)
        ||  ! ('archived' in task)
        ||  ! ('due_to' in task)
        ||  ! ('created_at' in task) ) {

            return false;
        }

        return true;
    }

    archive_task() {

        const update_entry = {
            id : this.task.id,
            archived : true
        }

        db_connection.send( "update", update_entry, (response) => {

            console.log( "Archive request response", response );
            this.arcihve_element();
        })
    }

    arcihve_element() {

        this.setAttribute( "archived", "" );

        const menu_bar = this.querySelector( ".menu_bar" );
        menu_bar.removeChild( this.pin_button );
        // menu_bar.removeChild( this.copy_button );
        menu_bar.removeChild( this.edit_button );
        menu_bar.removeChild( this.done_button );

        const info = document.createElement( "p" );
        info.textContent = "[Archived🗃️]";

        menu_bar.appendChild( info );
    }
}

customElements.define( "a-task", Task );