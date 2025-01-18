const DENOMS_5_10 = {
    white: 5,
    red: 25,
    blue: 100,
};
const DENOMS_10_20 = {
    white: 10,
    red: 50,
    blue: 100,
    black: 500,
};
const DENOMS_25_50 = {
    white: 25,
    red: 100,
    blue: 500,
    black: 2500,
};
const DENOMS_1_2 = {
    white: 100,
    red: 500,
    blue: 1000,
    black: 5000,
};

const STARTING_STACK_5_10 = {
    white: 10,
    red: 10,
    blue: 7,
};
const STARTING_STACK_10_20 = {
    white: 10,
    red: 10,
    blue: 9,
    black: 1,
};
const STARTING_STACK_25_50 = {
    white: 8,
    red: 8,
    blue: 8,
    black: 0,
};
const STARTING_STACK_1_2 = {
    white: 10,
    red: 10,
    blue: 9,
    black: 1,
};

const BLINDS = {
    "free": {
        denoms: {},
        startingStack: {},
        smallBlind: 0,
        bigBlind: 0,
    },
    ".05/.10": {
        denoms: DENOMS_5_10,
        startingStack: STARTING_STACK_5_10,
        smallBlind: 5,
        bigBlind: 10,
    },
    ".10/.20": {
        denoms: DENOMS_10_20,
        startingStack: STARTING_STACK_10_20,
        smallBlind: 10,
        bigBlind: 20,
    },
    ".25/.50": {
        denoms: DENOMS_25_50,
        startingStack: STARTING_STACK_25_50,
        smallBlind: 25,
        bigBlind: 50,
    },
    "1/2": {
        denoms: DENOMS_1_2,
        startingStack: STARTING_STACK_1_2,
        smallBlind: 100,
        bigBlind: 200,
    },
};

module.exports = { BLINDS };
