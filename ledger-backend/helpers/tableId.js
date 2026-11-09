const WORDS = [
    "apple", "apricot", "avocado", "banana", "blueberry", "cherry", "coconut", "cranberry", "date", "fig",
    "grape", "guava", "kiwi", "lemon", "lime", "lychee", "mango", "melon", "nectarine", "olive",
    "orange", "papaya", "peach", "pear", "pepper", "pickle", "plum", "pumpkin", "radish", "raspberry",
    "turnip", "waffle", "pancake", "bagel", "muffin", "pretzel", "noodle", "dumpling", "taco", "burrito",
    "alpaca", "axolotl", "badger", "beaver", "bison", "camel", "capybara", "cheetah", "chinchilla", "cobra",
    "coyote", "crab", "dingo", "dolphin", "donkey", "eagle", "falcon", "ferret", "flamingo", "gecko",
    "gerbil", "giraffe", "gopher", "hamster", "hedgehog", "heron", "hippo", "iguana", "jackal", "jaguar",
    "kangaroo", "koala", "lemur", "llama", "lobster", "lynx", "manatee", "meerkat", "mongoose", "moose",
    "narwhal", "ocelot", "octopus", "otter", "owl", "panda", "pelican", "penguin", "platypus", "puffin",
    "quokka", "rabbit", "raccoon", "salamander", "seal", "sloth", "squid", "tapir", "toucan", "walrus",
    "weasel", "wombat", "yak", "zebra", "anchor", "bucket", "cactus", "comet", "lantern", "marble",
    "meteor", "nebula", "pebble", "rocket", "saddle", "teapot", "thimble", "tornado", "trumpet", "volcano",
];

function randomWord() {
    return WORDS[Math.floor(Math.random() * WORDS.length)];
}

function generateTableId(existingIds) {
    let id;
    do {
        id = `${randomWord()}-${randomWord()}-${randomWord()}`;
    } while(existingIds.has(id));
    return id;
}

module.exports = { generateTableId };
