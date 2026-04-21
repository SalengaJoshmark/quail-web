import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Tag
} from 'lucide-react';
import { db } from '../firebase';
import { collection, onSnapshot, doc as firestoreDoc } from 'firebase/firestore';
import LoadingScreen from '../components/LoadingScreen';

const formatLocalDate = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const toJsDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value?.toDate === 'function') return value.toDate();
  if (typeof value?.seconds === 'number') return new Date(value.seconds * 1000);

  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  return null;
};

const toISODate = (value) => {
  const jsDate = toJsDate(value);
  if (jsDate) return formatLocalDate(jsDate);

  if (typeof value === 'string') {
    return value;
  }

  return null;
};

const getDateFromParts = (task) => {
  if (
    typeof task?.year === 'number' &&
    typeof task?.month === 'number' &&
    typeof task?.day === 'number'
  ) {
    return formatLocalDate(new Date(task.year, task.month, task.day));
  }

  return null;
};

const normalizeTask = (task, id) => {
  const primaryDate =
    toISODate(task?.date ?? task?.taskDate ?? task?.scheduledDate ?? task?.scheduleDate) ||
    getDateFromParts(task);

  const recurringSource = Array.isArray(task?.dates)
    ? task.dates
    : Array.isArray(task?.scheduleDates)
    ? task.scheduleDates
    : [];

  const recurringDates = recurringSource.map(toISODate).filter(Boolean);

  const allDates = primaryDate
    ? [primaryDate, ...recurringDates.filter((date) => date !== primaryDate)]
    : recurringDates;

  const resolvedStatus =
    task?.status ||
    (task?.completed === true || task?.isCompleted === true ? 'completed' : 'pending');

  const resolvedPriority = String(task?.priority || task?.level || 'medium').toLowerCase();

  return {
    id,
    ...task,
    title: task?.title || task?.name || task?.taskTitle || 'Untitled Task',
    time: task?.time || task?.scheduleTime || task?.startTime || 'No time',
    type: task?.type || task?.category || task?.taskType || '',
    priority: resolvedPriority,
    status: String(resolvedStatus).toLowerCase(),
    date: primaryDate,
    dates: allDates
  };
};

const extractEmbeddedTasks = (sharedData) => {
  const rawTasks = sharedData?.tasks;

  if (Array.isArray(rawTasks)) {
    return rawTasks.map((task, index) =>
      normalizeTask(task, task?.id || `shared-task-${index}`)
    );
  }

  if (rawTasks && typeof rawTasks === 'object') {
    return Object.entries(rawTasks).map(([id, task]) => normalizeTask(task, id));
  }

  return [];
};

const sortTasksByTime = (items) =>
  [...items].sort((a, b) => String(a.time || '').localeCompare(String(b.time || '')));

export default function Schedule() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const tasksCollectionRef = collection(db, 'farm_data', 'shared', 'tasks');
    const sharedDocRef = firestoreDoc(db, 'farm_data', 'shared');

    let latestSharedData = null;
    let collectionResolved = false;
    let collectionHasDocs = false;

    const applyEmbeddedTasks = () => {
      const embeddedTasks = extractEmbeddedTasks(latestSharedData);
      setTasks(sortTasksByTime(embeddedTasks));
      setLoading(false);
    };

    const unsubscribeSharedDoc = onSnapshot(
      sharedDocRef,
      (docSnap) => {
        latestSharedData = docSnap.exists() ? docSnap.data() : null;

        if (collectionResolved && !collectionHasDocs) {
          applyEmbeddedTasks();
        }
      },
      (error) => {
        console.error('Error reading shared task document:', error);

        if (collectionResolved && !collectionHasDocs) {
          setTasks([]);
          setLoading(false);
        }
      }
    );

    const unsubscribeTasksCollection = onSnapshot(
      tasksCollectionRef,
      (snapshot) => {
        collectionResolved = true;
        collectionHasDocs = !snapshot.empty;

        if (collectionHasDocs) {
          const items = snapshot.docs.map((docSnap) =>
            normalizeTask(docSnap.data(), docSnap.id)
          );

          setTasks(sortTasksByTime(items));
          setLoading(false);
          return;
        }

        applyEmbeddedTasks();
      },
      (error) => {
        console.error('Error reading tasks collection:', error);
        collectionResolved = true;
        collectionHasDocs = false;
        applyEmbeddedTasks();
      }
    );

    return () => {
      unsubscribeSharedDoc();
      unsubscribeTasksCollection();
    };
  }, []);

  const selectedDateStr = formatLocalDate(selectedDate);
  const todayStr = formatLocalDate(new Date());

  const filteredTasks = tasks.filter((task) => task.dates.includes(selectedDateStr));

  const upcomingEvents = tasks
    .filter((task) => task.dates.some((date) => date > selectedDateStr))
    .sort((a, b) => String(a.time || '').localeCompare(String(b.time || '')))
    .slice(0, 3);

  const completedCount = filteredTasks.filter((task) => task.status === 'completed').length;

  const getCategoryStyles = (type) => {
    const normalizedType = type?.toLowerCase() || '';

    if (normalizedType.includes('feed')) return 'bg-orange-100 text-orange-700 border-orange-200';
    if (normalizedType.includes('clean')) return 'bg-blue-100 text-blue-700 border-blue-200';
    if (normalizedType.includes('health')) return 'bg-red-100 text-red-700 border-red-200';
    if (normalizedType.includes('collect')) return 'bg-yellow-100 text-yellow-700 border-yellow-200';

    return 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const daysInMonth = new Date(
    selectedDate.getFullYear(),
    selectedDate.getMonth() + 1,
    0
  ).getDate();

  const firstDayOfMonth = new Date(
    selectedDate.getFullYear(),
    selectedDate.getMonth(),
    1
  ).getDay();

  return (
    <>
      {loading && <LoadingScreen message="Organizing your daily tasks..." />}

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-[#2D5016]">Farm Schedule</h2>
            <p className="text-gray-600 mt-1">
              {selectedDate.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-black uppercase tracking-tight text-gray-400">
              {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h3>

            <div className="flex gap-2">
              <button
                onClick={() =>
                  setSelectedDate(
                    new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1)
                  )
                }
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors border border-gray-100"
              >
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              </button>

              <button
                onClick={() => setSelectedDate(new Date())}
                className="px-4 py-1 text-xs font-bold text-[#2D5016] hover:bg-green-50 rounded-lg transition-colors border border-green-100"
              >
                Today
              </button>

              <button
                onClick={() =>
                  setSelectedDate(
                    new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1)
                  )
                }
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors border border-gray-100"
              >
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center text-sm font-semibold text-gray-600 pb-2">
                {day}
              </div>
            ))}

            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}

            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
              const calendarDate = formatLocalDate(
                new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day)
              );

              const hasTasks = tasks.some((task) => task.dates.includes(calendarDate));

              return (
                <div key={day} className="relative">
                  <button
                    onClick={() =>
                      setSelectedDate(
                        new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day)
                      )
                    }
                    className={`w-full aspect-square rounded-lg flex items-center justify-center text-sm transition-all ${
                      day === selectedDate.getDate()
                        ? 'bg-[#2D5016] text-white font-bold shadow-md scale-105'
                        : calendarDate === todayStr
                        ? 'bg-blue-100 text-blue-700 font-semibold'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    {day}
                  </button>

                  {hasTasks && (
                    <div
                      className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${
                        day === selectedDate.getDate() ? 'bg-white' : 'bg-[#2D5016]'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Tasks for this Day</h3>

            <div className="space-y-3">
              {filteredTasks.map((task) => (
                <div
                  key={task.id}
                  className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                    task.status === 'completed'
                      ? 'bg-green-50 border-green-200 opacity-75'
                      : 'bg-white border-gray-200 hover:border-[#2D5016]'
                  }`}
                >
                  <div className="flex-shrink-0">
                    {task.status === 'completed' ? (
                      <CheckCircle2 className="w-8 h-8 text-green-600" />
                    ) : (
                      <div className="w-8 h-8 border-2 border-gray-300 rounded-full" />
                    )}
                  </div>

                  <div className="flex-shrink-0 w-20 py-1 px-2 bg-gray-50 rounded-lg border border-gray-100 text-center">
                    <span className="text-[10px] text-gray-400 font-bold block leading-none mb-1">
                      TIME
                    </span>
                    <span className="text-sm font-black text-[#2D5016]">{task.time}</span>
                  </div>

                  <div className="flex-1">
                    <h4
                      className={`font-semibold ${
                        task.status === 'completed'
                          ? 'text-gray-500 line-through'
                          : 'text-gray-900'
                      }`}
                    >
                      {task.title}
                    </h4>

                    {task.type && (
                      <span
                        className={`inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter border ${getCategoryStyles(
                          task.type
                        )}`}
                      >
                        <Tag className="w-2.5 h-2.5" />
                        {task.type}
                      </span>
                    )}
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${
                      task.priority === 'high'
                        ? 'bg-red-100 text-red-700'
                        : task.priority === 'medium'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-green-100 text-green-700'
                    }`}
                  >
                    {task.priority || 'medium'}
                  </span>
                </div>
              ))}

              {filteredTasks.length === 0 && !loading && (
                <p className="text-center py-12 text-gray-400 italic">
                  No tasks assigned for this date.
                </p>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Task Summary</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <div className="text-2xl font-bold text-gray-900">{filteredTasks.length}</div>
                  <div className="text-xs text-gray-600">Tasks Today</div>
                </div>

                <div className="text-center p-4 bg-green-50 rounded-xl">
                  <div className="text-2xl font-bold text-green-600">{completedCount}</div>
                  <div className="text-xs text-gray-600">Completed</div>
                </div>
              </div>
            </div>

            <div className="bg-[#2D5016] text-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-center gap-2 mb-4">
                <CalendarDays className="w-6 h-6 text-yellow-400" />
                <h3 className="text-lg font-bold">Upcoming</h3>
              </div>

              <div className="space-y-4">
                {upcomingEvents.map((event) => (
                  <div key={event.id} className="border-l-2 border-yellow-400/50 pl-3 py-1">
                    <p className="text-sm font-bold truncate">{event.title}</p>
                    <p className="text-[10px] text-white/60 uppercase tracking-wider">
                      {event.time}
                    </p>
                  </div>
                ))}

                {upcomingEvents.length === 0 && (
                  <p className="text-xs text-white/50 italic">No future tasks detected.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
