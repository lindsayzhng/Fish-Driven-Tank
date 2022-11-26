const Motors = {
    RIGHT_FORWARD: 'GPIO18',
    RIGHT_BACKWARD: 'GPIO19',
    LEFT_FORWARD: 'GPIO13',
    LEFT_BACKWARD: 'GPIO12',

    MAX_VOLTAGE: 0.3, // max power: 30%
};

const Raw = {  // up to change
    MAX_INPUT: 1,
    MIN_INPUT: -1,

    INPUT_DEADBAND: {
        Joystick: 0.05,
        Fish: 0.05,
    },

    MAGNIFY_DEGREE: {
        Joystick: 3,
        Fish: 3,
    },
};

module.exports = {
    Motors,
    Raw,
}
