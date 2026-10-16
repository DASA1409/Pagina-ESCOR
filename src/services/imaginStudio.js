const BASE_URL = 'https://cdn.imagin.studio/getImage'

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function getCarImageUrl(make, model, angle = '01') {
  const params = new URLSearchParams({
    customer: 'img',
    make: slugify(make),
    modelFamily: slugify(model),
    angle,
    zoomType: 'fullscreen',
  })
  return `${BASE_URL}?${params.toString()}`
}

export function getVehicleImageUrl(vehicle, angle = '01') {
  return vehicle.imageUrl || getCarImageUrl(vehicle.make, vehicle.model, angle)
}

export const GALLERY_ANGLES = ['01', '09', '17', '21', '29']

export function getCarImageGallery(make, model) {
  return GALLERY_ANGLES.map((angle) => getCarImageUrl(make, model, angle))
}

export function getVehicleImageGallery(vehicle) {
  if (vehicle.imageUrl) return [vehicle.imageUrl]
  return getCarImageGallery(vehicle.make, vehicle.model)
}
