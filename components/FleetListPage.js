// components/FleetListPage.js (reescrito)

const FleetListPage = ({ user, userData, showAlert, onSelectCar, db, appInstanceId }) => {
  const { useState, useEffect } = React;
  const { collection, query, onSnapshot, addDoc, doc, updateDoc } = window.firebase;

  const [cars, setCars] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCarModal, setShowCarModal] = useState(false);
  const [carToEdit, setCarToEdit] = useState(null);

  const { companyId, role } = userData;
  const isAdmin = role === 'admin';
  const basePath = `artifacts/${appInstanceId}/users/${companyId}`;

  // Assinatura dos carros
  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, `${basePath}/cars`));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const carsData = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setCars(carsData);
        setIsLoading(false);
      },
      (error) => {
        console.error('Erro ao buscar a frota: ', error);
        showAlert('Erro ao carregar a frota.', 'error');
        setIsLoading(false);
      }
    );
    return unsubscribe;
  }, [db, basePath]);

  // Assinatura dos motoristas (para exibir e atribuir)
  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, `${basePath}/drivers`));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setDrivers(snapshot.docs.map((doc) => ({ id: doc.id, name: doc.data().name })));
    });
    return unsubscribe;
  }, [db, basePath]);

  const handleSaveCar = async (carData) => {
    const prepared = {
      ...carData,
      currentMileage: Number(carData.currentMileage),
      lastOilChange: Number(carData.lastOilChange),
      oilChangeInterval: Number(carData.oilChangeInterval),
      avgConsumption: parseFloat(carData.avgConsumption),
      assignedDriverId: carData.assignedDriverId || '',
    };
    const { id, ...dataToSave } = prepared;
    try {
      if (id) {
        await updateDoc(doc(db, `${basePath}/cars`, id), dataToSave);
        showAlert('Carro atualizado com sucesso!', 'success');
      } else {
        await addDoc(collection(db, `${basePath}/cars`), { ...dataToSave, createdAt: new Date() });
        showAlert('Carro adicionado com sucesso!', 'success');
      }
      setShowCarModal(false);
      setCarToEdit(null);
    } catch (e) {
      console.error(e);
      showAlert(`Erro ao salvar carro: ${e.code}`, 'error');
    }
  };

  if (isLoading) return <LoadingSpinner text="A carregar frota..." />;

  return (
    <div className="p-4 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Minha Frota</h1>
        {isAdmin && (
          <button
            onClick={() => {
              setCarToEdit(null);
              setShowCarModal(true);
            }}
            className="bg-blue-600 text-white font-bold p-2 w-10 h-10 md:px-4 md:w-auto md:h-auto rounded-lg hover:bg-blue-700 flex items-center justify-center transition-all"
          >
            <i className="fas fa-plus"></i>
            <span className="hidden md:inline md:ml-2">Adicionar Veículo</span>
          </button>
        )}
      </div>

      {cars.length === 0 && !isLoading ? (
        <div className="text-center py-16 bg-white rounded-lg shadow">
          <p className="text-gray-500">Nenhum veículo registado.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {cars.map((car) => {
            const assignedDriver = drivers.find((d) => d.id === car.assignedDriverId);
            return (
              <div
                key={car.id}
                onClick={() => onSelectCar(car.id)}
                className="bg-white rounded-xl shadow p-5 cursor-pointer hover:shadow-xl transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{car.name}</h3>
                    <p className="text-gray-600">{car.plate || 'Sem placa'}</p>
                    {assignedDriver && (
                      <p className="text-sm text-blue-600 mt-2 flex items-center gap-2">
                        <i className="fas fa-user"></i>
                        {assignedDriver.name}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-gray-800">{car.currentMileage || 0} km</p>
                    <i className="fas fa-chevron-right text-gray-400 mt-2"></i>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showCarModal && (
        <CarFormModal
          car={carToEdit}
          onClose={() => setShowCarModal(false)}
          onSave={handleSaveCar}
          drivers={drivers}
        />
      )}
    </div>
  );
};