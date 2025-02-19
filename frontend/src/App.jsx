import React, { useState, useEffect } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import axios from "axios";
import "react-big-calendar/lib/css/react-big-calendar.css";

const localizer = momentLocalizer(moment);

function App() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
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
  }, []);

  const handleAddEvent = (slotInfo) => {
    const title = window.prompt("Enter event title:");
    if (title) {
      const newEvent = {
        title,
        start: slotInfo.start,
        end: slotInfo.end,
      };
      axios
        .post("http://localhost:5000/api/events", newEvent)
        .then((response) => {
          setEvents([
            ...events,
            {
              ...response.data,
              start: new Date(response.data.start),
              end: new Date(response.data.end),
            },
          ]);
        })
        .catch((error) => console.error(error));
    }
  };

  const handleDeleteEvent = (event) => {
    if (window.confirm("Are you sure you want to delete this event?")) {
      axios
        .delete(`http://localhost:5000/api/events/${event.id}`)
        .then(() => {
          setEvents(events.filter((e) => e.id !== event.id));
        })
        .catch((error) => console.error(error));
    }
  };

  return (
    <>
      {" "}
      <div style={{ height: "500px" }}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          selectable
          onSelectSlot={handleAddEvent}
          onSelectEvent={handleDeleteEvent}
        />
      </div>
    </>
  );
}

export default App;
