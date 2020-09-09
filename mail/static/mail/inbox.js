document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#alert-view').style.display = 'none';
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';

  document.querySelector("#compose-form").onsubmit = () => {
    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
        recipients: document.querySelector('#compose-recipients').value,
        subject: document.querySelector('#compose-subject').value,
        body: document.querySelector('#compose-body').value
      })
    })
    .then(response => response.json())
    .then(result => {
      if (result["error"]) {
        document.querySelector('#alert-view').style.display = 'block';
        document.querySelector('#alert-view').innerHTML = result["error"];
      } else {
        load_mailbox('inbox');
      }
    });

    return false;
  }
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#alert-view').style.display = 'none';
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(monkeys => {
    monkeys.forEach(email => {
      const element = document.createElement('div');
      element.className = 'email';
      element.innerHTML = `<strong>${email.sender}</strong> ${email.subject}<span style="color:#959595;float:right;">${email.timestamp}</span>`;
      element.style.border = '1px solid black';
      element.style.padding = '5px';
      element.addEventListener('click', () => {load_email(email.id)})

      if (email.read) {
        element.style.backgroundColor = '#dcdcdc'
      }

      document.querySelector('#emails-view').append(element);
    })
  })
}

function load_email(email_id) {
  document.querySelector('#alert-view').style.display = 'none';
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  fetch(`/emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify({
      read: true
    })
  });

  fetch(`/emails/${email_id}`)
  .then(response => response.json())
  .then(email => {
    const emails_view = document.querySelector('#emails-view');
    emails_view.innerHTML = `<p><strong>From:</strong> ${email.sender}</p>`;
    emails_view.innerHTML += `<p><strong>To:</strong> ${email.recipients.join(', ').trim()}</p>`;
    emails_view.innerHTML += `<p><strong>Subject:</strong> ${email.subject}</p>`;
    emails_view.innerHTML += `<p><strong>Timestamp:</strong> ${email.timestamp}</p>`;

    if (email.recipients.includes(document.querySelector('#user-email').innerHTML)) {

      let buttonText;
      if (email.archived) {
        buttonText = 'Unarchive';
      } else {
        buttonText = 'Archive';
      }

      emails_view.innerHTML += `<button class="btn btn-sm btn-outline-primary" onclick="archive(${email.id}, ${email.archived});">${buttonText}</button>`;
    }

    emails_view.innerHTML += `<hr><p>${email.body}</p>`;
  });
}

function archive(email_id, archived) {
  fetch(`/emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify({
      archived: !archived
    })
  });
  load_mailbox('inbox');
}
