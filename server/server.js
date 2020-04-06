document.getElementById("status").innerHTML = "Creating server...";

const bugout = new Bugout({seed: localStorage["decent-pictionary-server-seed"]});
const users = [];
const messages = [];
const pad = new SignaturePad(document.getElementById("sketchpad"));

localStorage["decent-pictionary-server-seed"] = bugout.seed;
pad.off();

bugout.register("post-message", (address, message, callback) => {
    messages.push({"address": address, "message": message});
    if (messages.length > 10) {
        messages.shift();
    }
    document.getElementById("messages").value = messages.map(m => m["address"] + ": " + m["message"]).join("\n");
    bugout.send({"code": "refresh-messages", "messages": messages});
    callback({});
}, "Post a message to the party");

bugout.register("post-drawing", (_, drawing, callback) => {
    pad.fromData(drawing);
    bugout.send({"code": "refresh-drawing", "drawing": drawing});
    callback({});
}, "Post a drawing to the party");

bugout.register("list-messages", (_, __, callback) => {
    callback(messages);
}, "List all messages in the party");

bugout.register("list-users", (_, __, callback) => {
    callback(users);
}, "List all users in the party");

bugout.register("get-drawing", (_, __, callback) => {
    callback(pad.toData());
}, "Get drawing in the party");

bugout.once("connections", (_) => {
    document.getElementById("status").innerHTML = "Listening...";
    const url = location.href.replace("server", "client");
    document.getElementById("partyLink").href = url + "#" + bugout.address();
    document.getElementById("partyLink").innerText = "Share this link with your friends!";
});

bugout.on("seen", (address) => {
    users.push({"address": address});
    document.getElementById("users").value = users.map(u => u["address"]).join("\n");
    bugout.send({"code": "refresh-users", "users": users});
});

window.addEventListener("beforeunload", (_) => {
    bugout.close();
});

bugout.on("left", address => {
    for (let i = 0; i < users.length; ++i) {
        if (users[i]["address"] === address) {
            users.splice(i, 1);
        }
    }
    document.getElementById("users").value = users.map(u => u["address"]).join("\n");
    bugout.send({"code": "refresh-users", "users": users});
});