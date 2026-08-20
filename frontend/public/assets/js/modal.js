/* ================================================================
   MODAL
   ================================================================ */
function openModal() {
  document.getElementById('modal').classList.add('open');
}
function closeModal() {
  document.getElementById('modal').classList.remove('open');
}
function confirmModal() {
  closeModal();
  addToast('Violation Confirmed', 'Incident #INC-0341 has been confirmed and escalated to safety management.', 'info');
}
