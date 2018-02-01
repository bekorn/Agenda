const cache_name = "Agenda-Cache";

const update_adress = "/update.json";

const files_to_cache = [
    "offline.html",
    "/",
    "css/style.css",
    "js/main.js",
    "js/notificator.js",
];


self.addEventListener( "install", (event) => {

    //  Install without waiting and replace self on all clients (tabs)
    self.skipWaiting();
    // await clients.claim();

    event.waitUntil( init_worker( event ) );
});

async function init_worker( event ) {
    
    console.log( "Successfully registered the new ServiceWorker to", registration.scope );
    
    const cache = await caches.open( cache_name );

    const caching = cache.addAll( files_to_cache )
        .catch(
            error => {throw new Error( "Failed to cache required files. Check if the file paths are correct", error)}
        );

    return caching;
}


self.addEventListener( "activate", (event) => {

    console.log( "Activated the ServiceWorker", event );
});


self.addEventListener( "fetch", (event) => {

    console.log( "ServiceWorker fetching", event.request.url );

    event.respondWith( fetch_response( event ) );
});

async function fetch_response( event ) {

    //  First check if it is cached or not
    const cache_match = await caches.match( event.request );

    if( cache_match ) {

        console.log( "Fetched from cache", event.request.url );
        return cache_match;
    }
    //  If it is not cached, try to fetch and cache it

    //  But first we have to clone the reuest
    //  since it will be consumed when we fetch it
    //  because it is a stream.
    //  Browser will also consume this request.
    const request_to_fetch = event.request.clone();


    const response = await fetch( request_to_fetch );

    // Check the validity of the response
    if( ! response  ||  response.status != 200  ||  response.type != 'basic' ) {

        console.log( "Bad response!" );
        return response;
    }
    //  If the response is valid, cache and return it

    //  We also need to clone the response for the same reason
    const response_to_cache = response.clone();

    const cache = await caches.open( cache_name );

    cache.put( event.request, response_to_cache );
    
    console.log( "Fetched from server and cached", event.request.url );
    return response_to_cache;
}