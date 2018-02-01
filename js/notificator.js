

export function notify() {

    const title = "Bildirdim, geldi mi?";
    const options = {

        //  Main text
        body: "Burada uzun uzun açıklamalar yazacak. Şimdilik yalnızca boş sözler...",

        //  Smallest image, shown on the mobile notification bars
        bagde: "agenda.png",

        //  Medium image, shown as your logo on the left side of the notification
        icon: "agenda.png",

        //  Largest image, shown in bottom of the main text as content of the notification
        "image" : "agenda.png",

        //  Buttons on the bottom of the notification
        actions: [
            {
                action: "button1-pressed",
                title: "Button 1",
                icon: "agenda.png"
            },
            {
                action: "button2-pressed",
                title: "Button 2",
                icon: "agenda.png"
            },
            {
                action: "button3-pressed",
                title: "Button 3",
                icon: "agenda.png"
            },
            {
                action: "button4-pressed",
                title: "Button 4",
                icon: "agenda.png"
            }
        ],
    };

    sworker.showNotification(title, options);
}

