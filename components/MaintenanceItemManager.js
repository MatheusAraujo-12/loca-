// components/MaintenanceItemManager.js - VERSÃO DE DEPURAÇÃO

const MaintenanceItemManager = ({ db, basePath, onClose, showAlert }) => {
    const { useState, useEffect } = React;
    const { collection, query, onSnapshot, addDoc, deleteDoc, doc, orderBy, updateDoc, increment } = window.firebase;

    const [items, setItems] = useState([]);
    const [newItemData, setNewItemData] = useState({ name: '', price: '', type: 'Peça' });
    const [stockToAdd, setStockToAdd] = useState({});
    const [isLoading, setIsLoading] = useState(false);

    const itemsCollectionRef = collection(db, `${basePath}/maintenanceItems`);

    useEffect(() => {
        const q = query(itemsCollectionRef, orderBy("name"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setItems(fetchedItems);
        });
        return unsubscribe;
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setNewItemData(prev => ({ ...prev, [name]: value }));
    };

    const handleAddItem = async () => {
        if (!newItemData.name.trim()) return showAlert("O nome do item não pode estar vazio.", "error");
        setIsLoading(true);
        try {
            await addDoc(itemsCollectionRef, {
                name: newItemData.name.trim(),
                price: Number(newItemData.price) || 0,
                type: newItemData.type,
                stock: newItemData.type === 'Peça' ? 0 : null,
                createdAt: new Date()
            });
            showAlert(`'${newItemData.name.trim()}' foi adicionado como ${newItemData.type}!`, "success");
            setNewItemData({ name: '', price: '', type: 'Peça' });
        } catch (error) {
            console.error("Erro ao adicionar item: ", error);
            showAlert("Ocorreu um erro ao adicionar o item.", "error");
        } finally {
            setIsLoading(false);
        }
    };

    // Função de apagar COM DEPURAÇÃO
    const handleDeleteItem = async (itemId, itemName) => {
        if (!confirm(`Tem certeza que deseja apagar o item '${itemName}'?`)) {
            return;
        }
        try {
            const itemDocRef = doc(db, `${basePath}/maintenanceItems`, itemId);
            await deleteDoc(itemDocRef);
            showAlert(`'${itemName}' foi apagado com sucesso.`, "success");
        } catch (error) {
            // Esta mensagem é crucial para nós!
            console.error("ERRO AO TENTAR APAGAR ITEM:", error);
            showAlert("Ocorreu um erro ao apagar o item. Verifique o console.", "error");
        }
    };
    
    // Função de adicionar estoque COM DEPURAÇÃO
    const handleAddStock = async (itemId) => {
        const amountToAdd = Number(stockToAdd[itemId] || 0);
        if (amountToAdd <= 0) {
            showAlert("Por favor, insira uma quantidade positiva para adicionar.", "error");
            return;
        }

        const itemDocRef = doc(db, `${basePath}/maintenanceItems`, itemId);
        try {
            await updateDoc(itemDocRef, {
                stock: increment(amountToAdd)
            });
            showAlert(`${amountToAdd} unidade(s) adicionada(s) ao estoque!`, 'success');
            setStockToAdd(prev => ({...prev, [itemId]: ''}));
        } catch (error) {
            // Esta mensagem também é crucial!
            console.error("ERRO AO TENTAR ADICIONAR ESTOQUE:", error);
            showAlert("Ocorreu um erro ao atualizar o estoque.", "error");
        }
    };

    const handleStockInputChange = (itemId, value) => {
        setStockToAdd(prev => ({ ...prev, [itemId]: value }));
    };

    const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 modal-enter">
            <div className="bg-white rounded-xl shadow-2xl p-6 md:p-8 w-full max-w-2xl">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Gerir Estoque de Itens</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-6 p-4 border rounded-lg">
                    <input type="text" name="name" value={newItemData.name} onChange={handleChange} placeholder="Nome da Peça ou Serviço" className="md:col-span-2 bg-gray-100 p-3 rounded-lg border focus:ring-2 focus:ring-blue-500" />
                    <select name="type" value={newItemData.type} onChange={handleChange} className="bg-gray-100 p-3 rounded-lg border focus:ring-2 focus:ring-blue-500">
                        <option value="Peça">Peça</option>
                        <option value="Serviço">Serviço (Mão de Obra)</option>
                    </select>
                    <input type="number" name="price" value={newItemData.price} onChange={handleChange} placeholder="Preço (R$)" className="bg-gray-100 p-3 rounded-lg border focus:ring-2 focus:ring-blue-500" />
                    <button onClick={handleAddItem} disabled={isLoading} className="md:col-span-4 bg-blue-800 text-white font-bold py-3 px-5 rounded-lg hover:bg-blue-900 disabled:bg-blue-400 mt-2">{isLoading ? '...' : 'Cadastrar Novo Item'}</button>
                </div>
                <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                    <h3 className="font-bold text-lg text-gray-700">Itens Cadastrados</h3>
                    {items.length > 0 ? (
                        items.map(item => (
                            <div key={item.id} className="grid grid-cols-12 gap-2 items-center bg-gray-50 p-3 rounded-lg">
                                <div className="col-span-4">
                                    <p className="font-semibold text-gray-800 flex items-center gap-2">
                                        <i className={`fas ${item.type === 'Peça' ? 'fa-cog' : 'fa-wrench'}`}></i>
                                        {item.name}
                                    </p>
                                    <p className="text-sm text-gray-500 pl-6">{formatCurrency(item.price)}</p>
                                </div>
                                {item.type === 'Peça' ? (
                                    <>
                                        <div className="col-span-3 text-center">
                                            <p className="text-2xl font-bold text-blue-800">{item.stock || 0}</p>
                                            <p className="text-xs text-gray-500">EM ESTOQUE</p>
                                        </div>
                                        <div className="col-span-5 flex items-center gap-2">
                                            <input type="number" placeholder="+ Adicionar" value={stockToAdd[item.id] || ''} onChange={(e) => handleStockInputChange(item.id, e.target.value)} className="w-full bg-white p-2 rounded-lg border focus:ring-2 focus:ring-green-500 text-center" />
                                            <button onClick={() => handleAddStock(item.id)} className="bg-green-600 text-white font-bold py-2 px-3 rounded-lg hover:bg-green-700"><i className="fas fa-plus"></i></button>
                                            <button onClick={() => handleDeleteItem(item.id, item.name)} className="text-red-500 hover:text-red-700 bg-red-100 hover:bg-red-200 py-2 px-3 rounded-lg"><i className="fas fa-trash-alt"></i></button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="col-span-8 flex justify-end">
                                        <button onClick={() => handleDeleteItem(item.id, item.name)} className="text-red-500 hover:text-red-700 bg-red-100 hover:bg-red-200 py-2 px-3 rounded-lg"><i className="fas fa-trash-alt"></i></button>
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (<p className="text-center text-gray-500 py-4">Nenhum item cadastrado.</p>)}
                </div>
            </div>
        </div>
    );
};