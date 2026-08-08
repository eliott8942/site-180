function copyToClipboard(button, text) {
  navigator.clipboard.writeText(text).then(() => {
    // Change to check mark icon
    button.classList.add("clicked");

    // Revert back to original icon after 1 second
    setTimeout(() => {
      button.classList.remove("clicked");
    }, 1000);
  });
}