import Property from '../models/property';
import { HostawayCalendar } from '../types';
import { fetchHostawayData } from './utils';

export async function updateAvailableDates() {
  try {
    const properties = await Property.find().lean().orFail();

    for (const property of properties) {
      const calendar: HostawayCalendar = await fetchHostawayData(
        `/listings/${property.hostawayId}/calendar`
      );
      const availableDates = calendar
        .filter((el) => el.status === 'available')
        .map((el) => el.date);

      await Property.findByIdAndUpdate(property._id, { availableDates });
    }
  } catch (err) {
    console.log(err);
  }
}
