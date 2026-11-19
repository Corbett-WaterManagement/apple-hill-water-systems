document.querySelectorAll('[data-model-zoom]').forEach(button => {
  button.addEventListener('click', () => {
    const host = document.querySelector('#ah2-scene, #ah3-scene, #wire-scene');
    host?.dispatchEvent(new CustomEvent('model-zoom', {
      detail: { factor: button.dataset.modelZoom === 'in' ? 0.8 : 1.25 }
    }));
  });
});
