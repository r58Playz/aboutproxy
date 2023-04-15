var button = document.querySelector("button");
var tries = 0;

function buttonOnclick() {
    if (tries == 0) {
        button.innerText = "Please do not press this button again.";
        tries++;
    } else {
        button.remove();
    }
}
