const incidencesDB = new PouchDB('incidences');
const saveIncidence = (incidence) => {
    incidence._id = new Date().toISOString();
    return incidencesDB.put(incidence)
    .then((result) => {
        self.registratioin.sync.register('incidence-post');
        const response = {
            registered: true,
            offline: true
        };
        return new Promise(JSON.stringify(response));
    })
    .catch(err => {
        console.log(err);
        const response = {
            registered: false,
            offline: true
        };
        return new Promise(JSON.stringify(response));
    });
};

const savePostIncidence = () => {
    const incidences = [];
    return incidencesDB.allDocs({include_docs: true})
    .then(async (docs) => {
        const {rows} = docs;
        for (const row of rows) {
            const { doc } = row; //doc -> incidence
            const response = await fetch(
                'http://127.0.0.1:3000/api/incidences/status',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(doc),
                }
            )
            const data = await response.json();
            if (data['changed']) {
                incidences.push(incidencesDB.remove(doc));
                // return incidencesDB.remove(doc);
            }
        }

        const message = self.clients.matchAll().then((clients)=> {
            clients.forEach(client => {
                client.postMessage({type: 'RELOAD_PAGE_AFTER_SYNC'});
            });
        });
        return Promise.all(...incidences. message);
    });
}