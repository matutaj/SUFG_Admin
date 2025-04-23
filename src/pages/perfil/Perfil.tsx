import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllEmployees, updateEmployee } from '../../api/methods';
import { Funcionario } from 'types/models';
import { jwtDecode } from 'jwt-decode';
import paths from 'routes/paths';

interface UserData {
  nome: string;
  email: string;
  telefone: string;
  numeroBI: string;
  roles: string[];
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const [employee, setEmployee] = useState<Funcionario | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<Partial<Funcionario>>({});
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setIsLoading(true);
        const userData = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        if (!userData || !token) {
          console.error('Faltando user ou token no localStorage');
          navigate('/login');
          return;
        }

        const parsedUser: UserData = JSON.parse(userData);
        if (!parsedUser.numeroBI || !Array.isArray(parsedUser.roles)) {
          console.error('Dados de usuário inválidos:', parsedUser);
          throw new Error('Dados de usuário inválidos');
        }

        const decoded: { id?: string } = jwtDecode(token);
        if (!decoded.id) {
          console.error('ID não encontrado no token:', decoded);
          throw new Error('ID não encontrado no token');
        }

        const employees = await getAllEmployees();
        console.log('Funcionários recebidos:', employees);
        const currentEmployee = employees.find(
          (emp) => emp.id === decoded.id || emp.numeroBI === parsedUser.numeroBI,
        );

        if (!currentEmployee) {
          console.error(
            'Funcionário não encontrado para id:',
            decoded.id,
            'ou numeroBI:',
            parsedUser.numeroBI,
          );
          throw new Error('Funcionário não encontrado');
        }

        setEmployee(currentEmployee);
        setFormData({
          nomeFuncionario: currentEmployee.nomeFuncionario,
          emailFuncionario: currentEmployee.emailFuncionario,
          telefoneFuncionario: currentEmployee.telefoneFuncionario,
          moradaFuncionario: currentEmployee.moradaFuncionario,
          numeroBI: currentEmployee.numeroBI,
          profilePic: localStorage.getItem('profilePic') || undefined,
        });
      } catch (err) {
        console.error('Erro ao carregar perfil:', err);
        setErrorMessage('Erro ao carregar perfil. Tente novamente.');
        navigate('/login');
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (confirmPassword && e.target.value !== confirmPassword) {
      setPasswordError('As senhas não coincidem');
    } else {
      setPasswordError('');
    }
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value);
    if (password && e.target.value !== password) {
      setPasswordError('As senhas não coincidem');
    } else {
      setPasswordError('');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setFormData({ ...formData, profilePic: base64 });
        localStorage.setItem('profilePic', base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    if (!formData.nomeFuncionario?.trim()) return 'Nome é obrigatório';
    if (!formData.emailFuncionario?.trim()) return 'Email é obrigatório';
    if (!/\S+@\S+\.\S+/.test(formData.emailFuncionario!)) return 'Email inválido';
    if (!formData.telefoneFuncionario?.trim()) return 'Telefone é obrigatório';
    if (password && password.length < 6) return 'Senha deve ter pelo menos 6 caracteres';
    if (password && password !== confirmPassword) return 'As senhas não coincidem';
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    try {
      const updates: Partial<Funcionario> = {
        nomeFuncionario: formData.nomeFuncionario,
        emailFuncionario: formData.emailFuncionario,
        telefoneFuncionario: formData.telefoneFuncionario,
        moradaFuncionario: formData.moradaFuncionario,
        profilePic: formData.profilePic || undefined,
        ...(password && { senha: password }),
      };

      await updateEmployee(employee?.id!, updates);

      setEmployee((prev) =>
        prev
          ? {
              ...prev,
              nomeFuncionario: formData.nomeFuncionario!,
              emailFuncionario: formData.emailFuncionario!,
              telefoneFuncionario: formData.telefoneFuncionario!,
              moradaFuncionario: formData.moradaFuncionario!,
            }
          : prev,
      );

      const updatedUser: UserData = {
        nome: formData.nomeFuncionario!,
        email: formData.emailFuncionario!,
        telefone: formData.telefoneFuncionario!,
        numeroBI: employee!.numeroBI,
        roles: employee!.roles || [],
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));

      setEditMode(false);
      setSuccessMessage('Perfil atualizado!');
      setErrorMessage('');
      setPassword('');
      setConfirmPassword('');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Erro ao atualizar perfil:', err);
      setErrorMessage('Erro ao atualizar perfil. Tente novamente.');
    }
  };

  const handleCancel = () => {
    setFormData({
      nomeFuncionario: employee?.nomeFuncionario,
      emailFuncionario: employee?.emailFuncionario,
      telefoneFuncionario: employee?.telefoneFuncionario,
      moradaFuncionario: employee?.moradaFuncionario,
      numeroBI: employee?.numeroBI,
      profilePic: localStorage.getItem('profilePic') || undefined,
    });
    setPassword('');
    setConfirmPassword('');
    setPasswordError('');
    setErrorMessage('');
    setEditMode(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-gray-600 text-lg">Carregando...</div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-red-600 text-lg">Erro ao carregar perfil. Redirecionando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        {(successMessage || errorMessage) && (
          <div className="mb-4 transform transition-all animate-fade-in-down">
            <div
              className={`${
                successMessage
                  ? 'bg-emerald-50 border-l-4 border-emerald-400'
                  : 'bg-red-50 border-l-4 border-red-400'
              } p-4 rounded-r shadow-md`}
            >
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className={`h-5 w-5 ${successMessage ? 'text-emerald-400' : 'text-red-400'}`}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d={
                        successMessage
                          ? 'M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                          : 'M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1zm2 5a1 1 0 100-2 1 1 0 000 2z'
                      }
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className={`text-sm ${successMessage ? 'text-emerald-700' : 'text-red-700'}`}>
                    {successMessage || errorMessage}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-8">
            <div className="flex justify-between items-center">
              <h1 className="text-white text-2xl font-bold">Perfil do Usuário</h1>
              {!editMode && (
                <button
                  onClick={() => setEditMode(true)}
                  className="bg-white bg-opacity-20 backdrop-filter backdrop-blur-lg text-white px-4 py-2 rounded-lg hover:bg-opacity-30 transition-all duration-300 flex items-center"
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                    />
                  </svg>
                  Editar Perfil
                </button>
              )}
            </div>
          </div>

          <div className="p-6">
            <div className="flex flex-col lg:flex-row">
              <div className="flex flex-col items-center mb-8 lg:mb-0 lg:mr-8">
                <div className="relative">
                  <div className="w-48 h-48 rounded-full overflow-hidden shadow-lg border-4 border-white">
                    {formData.profilePic ? (
                      <img
                        src={formData.profilePic}
                        alt="Foto de perfil"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full bg-gradient-to-br from-indigo-400 to-purple-500 text-white">
                        <span className="text-5xl font-bold">
                          {employee.nomeFuncionario
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  {editMode && (
                    <label className="absolute bottom-0 right-0 cursor-pointer bg-white rounded-full p-3 shadow-md hover:shadow-lg transition-all duration-300">
                      <svg
                        className="w-5 h-5 text-gray-700"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </label>
                  )}
                </div>
                <div className="mt-4 text-center">
                  <h2 className="text-xl font-bold text-gray-800">{employee.nomeFuncionario}</h2>
                  <p className="text-indigo-600 font-medium">
                    {employee.roles?.join(', ') || 'Funcionário'}
                  </p>
                </div>
              </div>

              <div className="flex-1">
                {!editMode ? (
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-700 mb-4">
                      Informações Pessoais
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
                      <InfoField icon="id" label="BI" value={employee.numeroBI} />
                      <InfoField icon="email" label="Email" value={employee.emailFuncionario} />
                      <InfoField
                        icon="phone"
                        label="Telefone"
                        value={employee.telefoneFuncionario}
                      />
                      <InfoField
                        icon="location"
                        label="Morada"
                        value={employee.moradaFuncionario}
                        className="md:col-span-2"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-6 max-w-lg w-full mx-4">
                      <h3 className="text-lg font-semibold text-gray-700 mb-4">Editar Perfil</h3>
                      <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Nome
                            </label>
                            <input
                              type="text"
                              name="nomeFuncionario"
                              value={formData.nomeFuncionario || ''}
                              onChange={handleChange}
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Email
                            </label>
                            <input
                              type="email"
                              name="emailFuncionario"
                              value={formData.emailFuncionario || ''}
                              onChange={handleChange}
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Telefone
                            </label>
                            <input
                              type="tel"
                              name="telefoneFuncionario"
                              value={formData.telefoneFuncionario || ''}
                              onChange={handleChange}
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Morada
                            </label>
                            <input
                              type="text"
                              name="moradaFuncionario"
                              value={formData.moradaFuncionario || ''}
                              onChange={handleChange}
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Nova Senha
                            </label>
                            <input
                              type="password"
                              value={password}
                              onChange={handlePasswordChange}
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Confirmar Senha
                            </label>
                            <input
                              type="password"
                              value={confirmPassword}
                              onChange={handleConfirmPasswordChange}
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                            />
                            {passwordError && (
                              <p className="text-red-500 text-sm mt-1 flex items-center">
                                <svg
                                  className="w-4 h-4 mr-1"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                                {passwordError}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex justify-end mt-6 space-x-4">
                          <button
                            type="button"
                            onClick={handleCancel}
                            className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-all duration-300 shadow-sm"
                          >
                            Cancelar
                          </button>
                          <button
                            type="submit"
                            className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-md"
                            disabled={passwordError ? true : false}
                          >
                            Salvar
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoField({
  icon,
  label,
  value,
  className = '',
}: {
  icon: string;
  label: string;
  value: string;
  className?: string;
}) {
  const icons = {
    id: (
      <svg
        className="w-5 h-5 text-indigo-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"
        />
      </svg>
    ),
    email: (
      <svg
        className="w-5 h-5 text-indigo-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
        />
      </svg>
    ),
    phone: (
      <svg
        className="w-5 h-5 text-indigo-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
        />
      </svg>
    ),
    location: (
      <svg
        className="w-5 h-5 text-indigo-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
    ),
  };

  return (
    <div className={`flex items-start ${className}`}>
      {/*       <div className="flex-shrink-0 mt-1">{icons[icon]}</div>
       */}{' '}
      <div className="ml-3">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <p className="text-base text-gray-900">{value}</p>
      </div>
    </div>
  );
}
