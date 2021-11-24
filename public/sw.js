const remove = async () => {
  const registrations = await self.navigator.serviceWorker.getRegistrations()
  registrations.forEach(element => {
    element.unregister()
  });
}
remove()