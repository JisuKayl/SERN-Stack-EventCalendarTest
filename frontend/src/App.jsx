import React, { useState, useEffect } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment-timezone";
import axios from "axios";
import "react-big-calendar/lib/css/react-big-calendar.css";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./App.css";

const localizer = momentLocalizer(moment);

function App() {
  const [events, setEvents] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState("month");
  const [eventTitle, setEventTitle] = useState("");
  const [eventStart, setEventStart] = useState(
    moment().tz("Asia/Manila").toDate()
  );
  const [eventEnd, setEventEnd] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentEventId, setCurrentEventId] = useState(null);
  const [validationError, setValidationError] = useState("");

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = () => {
    axios
      .get("http://localhost:5000/api/events")
      .then((response) => {
        setEvents(
          response.data.map((event) => ({
            ...event,
            start: new Date(event.start),
            end: new Date(event.end),
          }))
        );
      })
      .catch((error) => console.error(error));
  };

  const handleAddEventButtonClick = () => {
    setValidationError("");
    const philippineTime = moment().tz("Asia/Manila").toDate();
    setEventStart(philippineTime);
    setEventEnd(null);
    setEventTitle("");
    setEditMode(false);
    setCurrentEventId(null);
    setShowEventModal(true);
  };

  const handleAddEvent = (slotInfo) => {
    setValidationError("");
    setEventStart(slotInfo.start);
    setEventEnd(null);
    setEventTitle("");
    setEditMode(false);
    setCurrentEventId(null);
    setShowEventModal(true);
  };

  const handleSelectEvent = (event) => {
    setValidationError("");
    setEventTitle(event.title);
    setEventStart(new Date(event.start));
    setEventEnd(new Date(event.end));
    setCurrentEventId(event.id);
    setEditMode(true);
    setShowEventModal(true);
  };

  const handleDeleteEvent = () => {
    if (window.confirm("Are you sure you want to delete this event?")) {
      axios
        .delete(`http://localhost:5000/api/events/${currentEventId}`)
        .then(() => {
          setEvents(events.filter((e) => e.id !== currentEventId));
          setShowEventModal(false);
        })
        .catch((error) => {
          console.error(error);
          alert("Failed to delete event. Please try again.");
        });
    }
  };

  const validateEvent = () => {
    if (!eventTitle.trim()) {
      setValidationError("Event title is required");
      return false;
    }

    if (!eventEnd) {
      setValidationError("End time is required");
      return false;
    }

    if (eventEnd < eventStart) {
      setValidationError("End time cannot be earlier than start time");
      return false;
    }

    setValidationError("");
    return true;
  };

  const handleSubmitEvent = () => {
    if (!validateEvent()) {
      return;
    }

    const eventData = {
      title: eventTitle,
      start: eventStart,
      end: eventEnd,
    };

    if (editMode) {
      axios
        .put(`http://localhost:5000/api/events/${currentEventId}`, eventData)
        .then((response) => {
          const updatedEvent = {
            ...response.data,
            start: new Date(response.data.start),
            end: new Date(response.data.end),
          };

          setEvents(
            events.map((event) =>
              event.id === currentEventId ? updatedEvent : event
            )
          );
          setShowEventModal(false);
        })
        .catch((error) => {
          console.error(error);
          alert("Failed to update event. Please try again.");
        });
    } else {
      axios
        .post("http://localhost:5000/api/events", eventData)
        .then((response) => {
          setEvents([
            ...events,
            {
              ...response.data,
              start: new Date(response.data.start),
              end: new Date(response.data.end),
            },
          ]);
          setShowEventModal(false);
        })
        .catch((error) => {
          console.error(error);
          alert("Failed to create event. Please try again.");
        });
    }
  };

  const handleNavigate = (newDate) => {
    setCurrentDate(newDate);
  };

  const handleView = (newView) => {
    setView(newView);
  };

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <h1>Event Calendar</h1>
        <button
          className="add-event-button"
          onClick={handleAddEventButtonClick}
        >
          Add Event
        </button>
      </div>

      <div className="calendar-wrapper">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          selectable
          onSelectSlot={handleAddEvent}
          onSelectEvent={handleSelectEvent}
          date={currentDate}
          onNavigate={handleNavigate}
          view={view}
          onView={handleView}
        />
      </div>

      {showEventModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>{editMode ? "Edit Event" : "Add New Event"}</h2>

            {validationError && (
              <div className="validation-error">{validationError}</div>
            )}

            <div className="form-group">
              <label>Event Title*</label>
              <input
                type="text"
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                className="form-control"
                placeholder="Enter event title"
                autoFocus
              />
            </div>

            <div className="form-group">
              <label>Start Time*</label>
              <DatePicker
                selected={eventStart}
                onChange={(date) => setEventStart(date)}
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={15}
                timeCaption="Time"
                dateFormat="MMMM d, yyyy h:mm aa"
                className="form-control"
              />
            </div>

            <div className="form-group">
              <label>End Time*</label>
              <DatePicker
                selected={eventEnd}
                onChange={(date) => setEventEnd(date)}
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={15}
                timeCaption="Time"
                dateFormat="MMMM d, yyyy h:mm aa"
                className="form-control"
                placeholderText="Select end time"
                minDate={eventStart}
              />
            </div>

            <div className="modal-actions">
              <button
                onClick={() => setShowEventModal(false)}
                className="button cancel-button"
              >
                Cancel
              </button>

              <div className="action-buttons">
                {editMode && (
                  <button
                    onClick={handleDeleteEvent}
                    className="button delete-button"
                  >
                    Delete
                  </button>
                )}

                <button
                  onClick={handleSubmitEvent}
                  className="button save-button"
                >
                  {editMode ? "Update" : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
