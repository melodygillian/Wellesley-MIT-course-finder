// BusScheduleHelper.js - Handles bus schedule recommendations
class BusScheduleHelper {
  static convertTo24Hour(time) {
    const [t, period] = time.split(' ');
    let [hours, minutes] = t.split(':').map(Number);
    
    if (period === 'pm' && hours !== 12) hours += 12;
    if (period === 'am' && hours === 12) hours = 0;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  static findBestBusOption(courseTime, courseLocation, existingCourses) {
    if (courseLocation === 'MIT' && existingCourses.some(c => c.location === 'Wellesley')) {
      const courseStartMinutes = ScheduleManager.timeToMinutes(courseTime.startTime);
      const busOptions = [];
      
      BUS_SCHEDULE.forEach((schedule, idx) => {
        const arrivalTime = schedule.stopTimes["77 Mass Ave."];
        const arrivalMinutes = ScheduleManager.timeToMinutes(this.convertTo24Hour(arrivalTime));
        
        if (arrivalMinutes <= courseStartMinutes - 20) {
          busOptions.push({
            busNumber: idx + 1,
            departure: schedule.stopTimes["Chapel_out"],
            arrival: arrivalTime,
            buffer: (courseStartMinutes - arrivalMinutes)
          });
        }
      });
      
      return busOptions.length > 0 ? busOptions[busOptions.length - 1] : null;
    }
    
    if (courseLocation === 'Wellesley' && existingCourses.some(c => c.location === 'MIT')) {
      const courseStartMinutes = ScheduleManager.timeToMinutes(courseTime.startTime);
      const busOptions = [];
      
      BUS_SCHEDULE.forEach((schedule, idx) => {
        const departureTime = schedule.stopTimes["77 Mass Ave."];
        const arrivalTime = schedule.stopTimes["Chapel_in"];
        const arrivalMinutes = ScheduleManager.timeToMinutes(this.convertTo24Hour(arrivalTime));
        
        if (arrivalMinutes <= courseStartMinutes - 10) {
          busOptions.push({
            busNumber: idx + 1,
            departure: departureTime,
            arrival: arrivalTime,
            buffer: (courseStartMinutes - arrivalMinutes)
          });
        }
      });
      
      return busOptions.length > 0 ? busOptions[busOptions.length - 1] : null;
    }
    
    return null;
  }
}
