const DENOMS_5_10 = {
    white: 0.05,
    red: 0.25,
    blue: 1,
};
const DENOMS_10_20 = {
    white: 0.1,
    red: 0.5,
    blue: 1,
    black: 5,
};
const DENOMS_25_50 = {
    white: 0.5,
    red: 1,
    blue: 5,
    black: 25,
};
const DENOMS_1_2 = {
    white: 1,
    red: 5,
    blue: 10,
    black: 50,
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
        smallBlind: .05,
        bigBlind: .10,
    },
    ".10/.20": {
        denoms: DENOMS_10_20,
        startingStack: STARTING_STACK_10_20,
        smallBlind: .10,
        bigBlind: .20,
    },
    ".25/.50": {
        denoms: DENOMS_25_50,
        startingStack: STARTING_STACK_25_50,
        smallBlind: .25,
        bigBlind: .50,
    },
    "1/2": {
        denoms: DENOMS_1_2,
        startingStack: STARTING_STACK_1_2,
        smallBlind: 1,
        bigBlind: 2,
    },
};

module.exports = { BLINDS };
