/**
 * Araç listesi filtreleme mantığı (saf fonksiyon — birim testli)
 */

export function filterCars(cars, { search = '', type = 'all', transmission = 'all' } = {}) {
  const query = search.toLowerCase();
  return cars.filter((car) => {
    const matchesSearch = car.name.toLowerCase().includes(query);
    const matchesType = type === 'all' || car.type.toLowerCase() === type.toLowerCase();
    const matchesTransmission =
      transmission === 'all' || car.transmission.toLowerCase() === transmission.toLowerCase();
    return matchesSearch && matchesType && matchesTransmission;
  });
}
