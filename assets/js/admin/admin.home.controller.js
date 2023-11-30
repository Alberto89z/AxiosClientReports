(() => {
  'use strict';
  const token = localStorage.getItem('token');
  if (!token) {
    localStorage.clear();
    changeView('');
  }
})();


const incidencesDB = new PouchDB('incidences');

const aceptIncidence = async (id) => {
  try {
    const response = await axiosClient.post('/incidences/status', {
      id,
      status: { id: 4 }
    });
    if (response['changed']) {
      toastMessage('Estado cambiado correctamente').showToast();
      getAllIncidencesPending();
    }
  } catch (error) {
    toastMessage('Error al cambiar el estado').showToast();
  }
}
const rejectIncidence = async (id) => {
  try {
    const response = await axiosClient.post('/incidences/status', {
      id,
      status: { id: 6 }
    });
    if (response['changed']) {
      toastMessage('Estado cambiado correctamente').showToast();
      getAllIncidencesPending();
    }
  } catch (error) {
    toastMessage('Error al cambiar el estado').showToast();
  }
}

const getAllIncidencesPending = async () => {
  try {
    const table = $('#incidencesTable').DataTable();
    table.destroy();
    const user = parseJWT();
    const response = await axiosClient.get(`/incidences/pending/${user.id}`);
    const tableBody = $('#incidencesBody');
    let content = '';

    tableBody.html('');
    const { rows } = await incidencesDB.allDocs({ include_docs: true });
    for (const [i, incidence] of response?.incidences.entries()) {
      var dateTemp = new Date(incidence.incidenceDate);
      const day = String(dateTemp.getDate()).padStart(2,'0');
      const month = String(dateTemp.getMonth() + 1).padStart(2,'0');
      const year = String(dateTemp.getFullYear());
      content += `
      <tr>
        <td>${i+1}</td>
        <td>${incidence.person.name} ${incidence.person.surname} ${incidence.person.lastname ?? ''}</td>
        <td>${incidence.user.area.name}</td>
        <td>${day}/${month}/${year}</td>
        <td>
            ${
              rows.find(row=>row.doc.id === incidence.id)
              ?
              ` <button class="btn btn-outline-success btn-sm" disabled><i class="bi bi-file-earmark-text"></i> ACEPTAR</button>
                <button class="btn btn-outline-danger btn-sm" disabled><i class="bi bi-trash3"></i> RECHAZAR</button>
              `
              :
              `
              <button class="btn btn-outline-success btn-sm" onclick='aceptIncidence(${incidence.id})'><i class="bi bi-file-earmark-text"></i>ACEPTAR</button>
              <button class="btn btn-outline-danger btn-sm" onclick='rejectIncidence(${incidence.id})'><i class="bi bi-trash3"></i>RECHAZAR</button
              `
            }
        </td>
      </tr>
      `;
    }//forof
    tableBody.html(content);
    new DataTable(document.getElementById('incidencesTable'), {
      columnDefs: [{ orderable: false, targets: 4 }],
      language: {
        url: 'https://cdn.datatables.net/plug-ins/1.13.6/i18n/es-ES.json',
      },
    });
  } catch (error) {
    console.log(error);
  }
}

$(document).ready(function () {
  if (!fullname) fullname = localStorage.getItem('fullname');
  if (!role) role = localStorage.getItem('activeRole');
  $('#fullname').text(fullname);
  $('#fullname2').text(fullname);
  $('#role').text(role);
  getAllIncidencesPending();
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'RELOAD_PAGE_AFTER_SYNC') {
      window.location.reload(true);
    }
  })
});
