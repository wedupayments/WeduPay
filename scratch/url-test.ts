try {
    const u = new URL("A:");
    console.log("A: is valid", u.href);
} catch (e) {
    console.log("A: is invalid");
}
try {
    const u = new URL("http://google.com");
    console.log("http://google.com is valid", u.href);
} catch (e) {
    console.log("http://google.com is invalid");
}
