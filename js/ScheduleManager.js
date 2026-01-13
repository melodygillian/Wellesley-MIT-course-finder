// ScheduleManager.js - Handles schedule conflict detection
class ScheduleManager {
  static timeToMinutes(timeStr) {
    if (!timeStr) return 0;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  static minutesToTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  static checkConflict(existingTime, newTime, existingLocation, newLocation) {
    const daysOverlap = existingTime.days.some(day => newTime.days.includes(day));
    if (!daysOverlap) return false;
    
    let bufferMinutes = 15;
    if (existingLocation !== newLocation) {
      bufferMinutes = 60;
    }
    
    const existingStart = this.timeToMinutes(existingTime.startTime) - bufferMinutes;
    const existingEnd = this.timeToMinutes(existingTime.endTime) + bufferMinutes;
    const newStart = this.timeToMinutes(newTime.startTime);
    const newEnd = this.timeToMinutes(newTime.endTime);
    
    return (newStart < existingEnd && newEnd > existingStart);
  }

  static findCompatibleCourses(existingCourses, allCourses) {
    return allCourses.filter(course => {
      const courseLocation = course.source;
      return course.meetingTimes.every(meetingTime => {
        return !existingCourses.some(existing => 
          this.checkConflict(existing, meetingTime, existing.location, courseLocation)
        );
      });
    });
  }

  static getCourseInSlot(courses, day, time) {
    return courses.find(course => {
      if (!course.days.includes(day)) return false;
      const slotMinutes = this.timeToMinutes(time);
      const courseStart = this.timeToMinutes(course.startTime);
      const courseEnd = this.timeToMinutes(course.endTime);
      return slotMinutes >= courseStart && slotMinutes < courseEnd;
    });
  }
}
