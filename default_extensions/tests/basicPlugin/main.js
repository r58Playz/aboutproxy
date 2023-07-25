()=>{
  const eventel = document.querySelector(".aboutbrowser-event-el#aboutbrowser-event-el");
  eventel.addEventListener("aboutbrowser-contextmenu", (/*e*/)=>{
    // e.preventDefault();
    console.log("context menu");
  });
}
