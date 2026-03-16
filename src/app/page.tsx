'use client';

import { useState } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import CalendarGrid from '@/components/calendar/CalendarGrid';
import AnalyticsView from '@/components/views/AnalyticsView';
import SettingsView from '@/components/views/SettingsView';
import TrashView from '@/components/views/TrashView';
import EventModal from '@/components/modal/StageModal';
import type { CalendarEvent, EventColorId } from '@/types/stage';

export default function DashboardPage() {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeNav, setActiveNav] = useState('calendar');

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const handleCreateEvent = (date: Date) => {
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const newEvent: CalendarEvent = {
      id: `new-${Date.now()}`,
      title: '',
      description: '',
      scheduledDate: dateStr,
      endDate: dateStr,
      startTime: null,
      endTime: null,
      allDay: false,
      colorId: 'peacock' as EventColorId,
      completed: false,
      deletedAt: null,
      createdAt: new Date().toISOString(),
      location: '',
      attendees: [],
      attachments: [],
      groupId: null,
      groupName: null,
      repeatType: 'none',
    };
    setSelectedEvent(newEvent);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedEvent(null);
  };

  return (
    <div className="dashboard-layout">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        activeNav={activeNav}
        onNavChange={setActiveNav}
        onEventClick={handleEventClick}
      />

      <div className="dashboard-main">
        {activeNav === 'calendar' && (
          <main>
            <CalendarGrid
              onEventClick={handleEventClick}
              onCreateEvent={handleCreateEvent}
            />
          </main>
        )}
        {activeNav === 'analytics' && <AnalyticsView />}
        {activeNav === 'settings' && <SettingsView />}
        {activeNav === 'trash' && <TrashView />}
      </div>

      {isModalOpen && (
        <EventModal event={selectedEvent} onClose={handleCloseModal} />
      )}
    </div>
  );
}
