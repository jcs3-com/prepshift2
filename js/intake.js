/* Prepshift intake forms.
 *
 * The site stores nothing. Submitting a form writes an email in the
 * visitor's own mail app, addressed to Prepshift, with their answers
 * filled in. If no mail app opens, the same message is shown on the page
 * to copy and send by hand.
 *
 * Markup: <form data-intake data-topic="Prepshift Juice" data-to="name@prepshift.com">
 * Every named field becomes one "Label: value" line; the label is the
 * field's name attribute.
 */
(function () {
  function compose(form) {
    var topic = form.getAttribute('data-topic') || 'Prepshift';
    var lines = [];
    var business = '';
    var name = '';
    Array.prototype.forEach.call(form.elements, function (el) {
      if (!el.name || el.type === 'submit' || el.type === 'button') return;
      var value = (el.value || '').trim();
      if (!value) return;
      if (el.name === 'Topic') { topic = value; return; }
      if (el.name === 'Business') business = value;
      if (el.name === 'Name') name = value;
      lines.push(el.name + ': ' + value);
    });
    var who = business || name;
    return {
      subject: topic + ' inquiry' + (who ? ' from ' + who : ''),
      body: lines.join('\n') + '\n'
    };
  }

  function wire(form) {
    var to = form.getAttribute('data-to');
    var fallback = form.querySelector('[data-intake-fallback]');
    var pre = fallback && fallback.querySelector('pre');
    var copyBtn = fallback && fallback.querySelector('[data-intake-copy]');

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var msg = compose(form);
      var href = 'mailto:' + to +
        '?subject=' + encodeURIComponent(msg.subject) +
        '&body=' + encodeURIComponent(msg.body);
      if (fallback && pre) {
        pre.textContent = 'To: ' + to + '\nSubject: ' + msg.subject + '\n\n' + msg.body;
        fallback.hidden = false;
        if (copyBtn) copyBtn.textContent = 'Copy message';
      }
      window.location.href = href;
    });

    if (copyBtn && pre) {
      copyBtn.addEventListener('click', function () {
        var text = pre.textContent;
        var done = function () { copyBtn.textContent = 'Copied'; };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(done, function () { selectText(pre); });
        } else {
          selectText(pre);
        }
      });
    }
  }

  function selectText(node) {
    var range = document.createRange();
    range.selectNodeContents(node);
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }

  document.querySelectorAll('form[data-intake]').forEach(wire);
})();
