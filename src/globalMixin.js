import Events from '@/events';

/**
 * Global mixin applied to all Vue components.
 * Provides event dispatch/listen helpers.
 */
export default {
    methods: {
        dispatch(evt, data) {
            Events.emit(evt, data);
        },
        listen(evt, fn, ctx) {
            Events.on(evt, fn, ctx || this);
        },
        unlisten(evt, fn, ctx) {
            Events.off(evt, fn, ctx || this);
        }
    }
};
