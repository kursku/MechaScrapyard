import EventEmitter from 'eventemitter3';

/**
 * Global event bus for the game.
 * Used for cross-component communication.
 */
const Events = new EventEmitter();

export default Events;
