(() => {
  'use strict';
  const token = localStorage.getItem('token');
  if (!token) {
    localStorage.clear();
    changeView('');
  }
})();
let payload = {
  title: '',
  type: "",
  description: "",
  incidenceDate: "",
  status: { id: 4 },
  annexes: [],
  location: {
    lat: 0,
    lng: 0
  }
};

const camera = new Camera($('#player')[0]);
const incidencesDB = new PouchDB('docentIncidences');
const cancelIncidence = (id) = {};
const editIncidence = (id) = {};

const currentLocation = () => {
  if (navigator.geolocation) {
    toastMessage('Cargando mapa...').showToast();
    navigator.geolocation.getCurrentPosition((pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      payload.location = {
        lat, lng
      };
      showMapWithLocation(lat, lng);
    });
  }
};

const showMapWithLocation = (lat, lng) => {
  let content = `
    <iframe
        width="100%" height="250"
        frameborder="0" scrolling="no" marginheight="0" marginwidth="0"
        src="https://maps.google.com/maps?width=100%25&amp;height=600&amp;hl=es&amp;q=${lat},${lng}+(Prueba)&amp;t=&amp;z=14&amp;ie=UTF8&amp;iwloc=B&amp;output=embed" 
    >
    </iframe>
  `;
  document.getElementById('modal-map').innerHTML = content;
};

const initializeCamera = () => {
  toastMessage('Cargando camanara').showToast();
  $("#modal-camera").css('display', 'block');
  camera.powerOn();
}

const takeAPhoto = () => {
  const photo = camera.takeAPhoto();
  payload = { ...payload, annexes: [{ name: 'Photo' + $('#title').val(), mimeType: 'png', file: photo }] }
  camera.powerOff();
}


const saveIncidence = async () => {
  const user = parseJWT();
  const title = document.getElementById('title').value;
  const type = document.getElementById('type').value;
  const description = document.getElementById('description').value;
  const incidenceDate = document.getElementById('incidenceDate').value;

  payload.title = title;
  payload.type = type;
  payload.description = description;
  payload.incidenceDate = incidenceDate;
  payload.userId = user.areas[0].id,

    console.log(payload);
  const response = await axiosClient.post(`/incidences/save`, payload);
  console.log(response);
  if (response.registered) {
    document.getElementById('title').value = "";
    document.getElementById('type').value = "";
    document.getElementById('description').value = "";
    document.getElementById('incidenceDate').value = "";
    document.getElementById('modal-map').innerHTML = '<span></span>';
    $("#modal-camera").css('display', 'none');

    toastMessage('Inicencia registrada').showToast();
    getAllIncidencesByEmployee();
    $('#largeModal').modal('hide');
  } else {
    toastMessage('Nose pudo registrar la incidencia').showToast();
  }
};


const getAllIncidencesByEmployee = async () => {
  try {
    const table = $('#incidencesTable').DataTable();
    table.destroy();
    const user = parseJWT();
    const response = await axiosClient.get(`/incidences/${user.id}`);
    const incidences = document.getElementById('ownIncidences');
    let content = ``;
    incidences.innerHTML = ``;
    const { rows } = await incidencesDB.allDocs({ include_docs: true });
    for (const [i, incidence] of response?.incidences.entries()) {
      const date = new Date(incidence.incidenceDate);
      const day = String(date.getDate()).padStart(2, '0'); // Ensure two-digit day
      const month = String(date.getMonth() + 1).padStart(2, '0'); // Ensure two-digit month (months are zero-based)
      const year = date.getFullYear();
      content += `
          <tr>
            <th scope="row">${i + 1}</th>
            <td>${incidence.person.name +
        ' ' +
        incidence.person.surname +
        ' ' +
        (incidence.person.lastname ?? '')
        }</td>
            <td>${incidence.user.area.name}</td>
            <td>${day}-${month}-${year}</td>
            <td><span class="badge bg-info">${incidence.status.description
        }</span></td>
            <td>
              <button onclick="editIncidence(${i})" class="btn btn-warning btn-sm">EDITAR</button>
              <button onclick="cancelIncidence(${i})" class="btn btn-danger btn-sm">CANCELAR</button>
            </td>
          </tr>
          `;
    }
    incidences.innerHTML = content;
    new DataTable($('#incidencesTable'), {
      columnDefs: [{ orderable: false, targets: 4 }],
      language: {
        url: 'https://cdn.datatables.net/plug-ins/1.13.6/i18n/es-ES.json',
      },
    });
  } catch (error) {
    console.log(error);
  }
};

$(document).ready(function () {
  if (!fullname) fullname = localStorage.getItem('fullname');
  if (!role) role = localStorage.getItem('activeRole');
  $('#fullname').text(fullname);
  $('#fullname2').text(fullname);
  $('#role').text(role);
  getAllIncidencesByEmployee();
});