var config = module.exports;

config["promise@node"] = {
    environment: "node",
    libs: ["../lib/buster-assertions.js"],
    tests: [
        "**/*.js"
    ]
}
