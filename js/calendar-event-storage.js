(function () {
    const DEFAULT_EVENT_TITLE = '未命名事件';
    const DEFAULT_CALENDAR = 'personal';
    const DEFAULT_COLOR = '#60a5fa';

    function createEventId() {
        return `event-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    }

    function normalizeDate(value, fallbackValue) {
        const date = value instanceof Date ? new Date(value.getTime()) : new Date(value || fallbackValue || Date.now());
        return Number.isNaN(date.getTime()) ? new Date(fallbackValue || Date.now()) : date;
    }

    function normalizeAttendees(attendees) {
        if (!Array.isArray(attendees)) return [];
        return attendees
            .map(attendee => String(attendee || '').trim())
            .filter(Boolean);
    }

    function normalizeEvent(event) {
        if (!event || typeof event !== 'object') return null;

        const start = normalizeDate(event.start);
        let end = normalizeDate(event.end, start.getTime() + 60 * 60 * 1000);
        if (end <= start) {
            end = new Date(start.getTime() + 60 * 60 * 1000);
        }

        const title = String(event.title || DEFAULT_EVENT_TITLE).trim() || DEFAULT_EVENT_TITLE;
        return {
            ...event,
            id: event.id || createEventId(),
            title,
            start,
            end,
            location: String(event.location || '').trim(),
            calendar: String(event.calendar || DEFAULT_CALENDAR).trim() || DEFAULT_CALENDAR,
            description: String(event.description || '').trim(),
            color: String(event.color || DEFAULT_COLOR).trim() || DEFAULT_COLOR,
            attendees: normalizeAttendees(event.attendees),
            sourceTaskId: event.sourceTaskId ? String(event.sourceTaskId) : ''
        };
    }

    function normalizeEvents(events) {
        if (!Array.isArray(events)) return [];
        return events.map(normalizeEvent).filter(Boolean);
    }

    function serializeEvent(event) {
        const normalized = normalizeEvent(event);
        if (!normalized) return null;
        return {
            ...normalized,
            start: normalized.start.toISOString(),
            end: normalized.end.toISOString()
        };
    }

    function serializeEvents(events) {
        return normalizeEvents(events)
            .map(serializeEvent)
            .filter(Boolean);
    }

    function parseEvents(rawValue) {
        if (!rawValue) return [];
        try {
            return normalizeEvents(JSON.parse(rawValue));
        } catch (error) {
            console.warn('Failed to parse calendar events, falling back to an empty list.', error);
            return [];
        }
    }

    function getEvents(storageKey) {
        return parseEvents(localStorage.getItem(storageKey));
    }

    function setEvents(storageKey, events = []) {
        const serializedEvents = serializeEvents(events);
        localStorage.setItem(storageKey, JSON.stringify(serializedEvents));
        return normalizeEvents(serializedEvents);
    }

    function loadFromKeys(candidateKeys = []) {
        const eventsById = new Map();
        candidateKeys.forEach(key => {
            if (!key) return;
            getEvents(key).forEach(event => {
                if (!eventsById.has(event.id)) {
                    eventsById.set(event.id, event);
                }
            });
        });
        return Array.from(eventsById.values());
    }

    window.CalendarEventStorage = {
        normalizeEvent,
        normalizeEvents,
        serializeEvent,
        serializeEvents,
        parseEvents,
        getEvents,
        setEvents,
        loadFromKeys
    };
})();
