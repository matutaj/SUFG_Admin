import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllEmployees, updateEmployee, getAllFunctions } from '../../api/methods'; // Adicionar getAllFunctions
import { Funcionario, Funcao } from 'types/models';
import { jwtDecode } from 'jwt-decode';
import { getUserData } from '../../api/authUtils';
import './ProfilePage.css';

interface DecodedToken {
  userId: string;
  email: string;
  nome: string;
  role: string;
  exp?: number;
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
  const [roleName, setRoleName] = useState<string>('Funcionário'); // Estado para o nome da função

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setIsLoading(true);
        console.log('Iniciando carregamento do perfil...');
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('Token não encontrado no localStorage');
          navigate('/login');
          return;
        }

        let decoded: DecodedToken;
        try {
          decoded = jwtDecode<DecodedToken>(token);
          console.log('Token decodificado:', decoded);
        } catch (err) {
          console.error('Erro ao decodificar token:', err);
          throw new Error('Token inválido');
        }

        // Verificar expiração do token
        if (decoded.exp && decoded.exp * 1000 < Date.now()) {
          console.error('Token expirado');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login');
          return;
        }

        if (!decoded.userId || !decoded.email || !decoded.nome) {
          console.error('Dados obrigatórios ausentes no token:', decoded);
          throw new Error('Dados do token inválidos');
        }

        // Obter dados do usuário do authUtils
        const userData = await getUserData();
        if (!userData) {
          console.error('Dados do usuário não encontrados');
          navigate('/login');
          return;
        }

        // Definir o nome da função a partir do token
        const roles = decoded.role;
        let displayRole = roles || 'Funcionário';

        // Buscar funcionários
        const employees = await getAllEmployees();
        console.log('Funcionários recebidos:', employees);
        const currentEmployee = employees.find((emp) => emp.id === decoded.userId);

        if (!currentEmployee) {
          console.error('Funcionário não encontrado para id:', decoded.userId);
          throw new Error('Perfil não encontrado');
        }

        // Se id_funcao for um ID, buscar o nome da função
        if (currentEmployee.id_funcao && !isNaN(Number(currentEmployee.id_funcao))) {
          try {
            const functions = await getAllFunctions();
            const funcao = functions.find((f) => f.id === currentEmployee.id_funcao);
            /*     displayRole = funcao?.nome || displayRole; */
          } catch (err) {
            console.error('Erro ao buscar nome da função:', err);
          }
        } else if (currentEmployee.id_funcao) {
          /*     displayRole = currentEmployee.id_funcao; */
          // Usar id_funcao se já for o nome
        }

        setRoleName(displayRole);
        console.log('DisplayRole:', displayRole);
        setEmployee(currentEmployee);
        setFormData({
          nomeFuncionario: currentEmployee.nomeFuncionario,
          emailFuncionario: currentEmployee.emailFuncionario,
          telefoneFuncionario: currentEmployee.telefoneFuncionario,
          moradaFuncionario: currentEmployee.moradaFuncionario,
          numeroBI: currentEmployee.numeroBI,
          profilePic: localStorage.getItem('profilePic') || undefined,
        });
        console.log('Perfil carregado com sucesso:', currentEmployee);
      } catch (err: any) {
        console.error('Erro ao carregar perfil:', err.message);
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login');
        }
        setErrorMessage(err.message || 'Erro ao carregar perfil. Tente novamente.');
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

      // Atualizar localStorage com os novos dados
      const userData = await getUserData();
      if (userData) {
        const updatedUser = {
          ...userData,
          nome: formData.nomeFuncionario!,
          email: formData.emailFuncionario!,
          telefone: formData.telefoneFuncionario!,
          numeroBI: employee!.numeroBI,
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }

      setEditMode(false);
      setSuccessMessage('Perfil atualizado!');
      setErrorMessage('');
      setPassword('');
      setConfirmPassword('');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      console.error('Erro ao atualizar perfil:', err);
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      }
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
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <span className="loading-text">Carregando perfil...</span>
      </div>
    );
  }

  if (errorMessage && !employee) {
    return (
      <div className="error-container">
        <div className="error-card">
          <div className="error-content">
            <svg className="error-icon" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1zm2 5a1 1 0 100-2 1 1 0 000 2z"
                clipRule="evenodd"
              />
            </svg>
            <div className="error-message-container">
              <p className="error-message">{errorMessage}</p>
              <button onClick={() => navigate('/login')} className="error-button">
                Voltar ao Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      {(successMessage || errorMessage) && (
        <div className={`message-container ${successMessage ? 'success' : 'error'}`}>
          <svg className="message-icon" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d={
                successMessage
                  ? 'M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                  : 'M10 18a8 8 0 100-16 8 8 0 0116 0zM8 7a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1zm2 5a1 1 0 100-2 1 1 0 000 2z'
              }
              clipRule="evenodd"
            />
          </svg>
          <p className="message-text">{successMessage || errorMessage}</p>
        </div>
      )}

      <div className="profile-card">
        <div className="profile-header">
          <div className="header-content">
            <svg className="header-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            <h1 className="header-title">Perfil do Usuário</h1>
          </div>
          {!editMode && (
            <button onClick={() => setEditMode(true)} className="edit-button">
              <svg className="edit-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

        <div className="profile-content">
          <div className="profile-sidebar">
            <div className="profile-pic-container">
              <div className="profile-pic">
                {formData.profilePic ? (
                  <img src={formData.profilePic} alt="Foto de perfil" />
                ) : (
                  <div className="profile-pic-placeholder">
                    <span>
                      {employee?.nomeFuncionario
                        ?.split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase() || 'N/A'}
                    </span>
                  </div>
                )}
              </div>
              {editMode && (
                <label className="profile-pic-upload">
                  <svg
                    className="upload-icon"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
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
            <div className="profile-info">
              <h2 className="profile-name">{employee?.nomeFuncionario || 'N/A'}</h2>
              <p className="profile-role">{roleName}</p>
            </div>
          </div>

          <div className="profile-main">
            {!editMode ? (
              <div className="info-card">
                <h3 className="info-title">Informações Pessoais</h3>
                <div className="info-grid">
                  <InfoField icon="id" label="BI" value={employee?.numeroBI || 'N/A'} />
                  <InfoField
                    icon="email"
                    label="Email"
                    value={employee?.emailFuncionario || 'N/A'}
                  />
                  <InfoField
                    icon="phone"
                    label="Telefone"
                    value={employee?.telefoneFuncionario || 'N/A'}
                  />
                  <InfoField
                    icon="location"
                    label="Morada"
                    value={employee?.moradaFuncionario || 'N/A'}
                    className="info-full"
                  />
                </div>
              </div>
            ) : (
              <div className="edit-modal">
                <div className="edit-card">
                  <h3 className="edit-title">Editar Perfil</h3>
                  <form onSubmit={handleSubmit} className="edit-form">
                    <div className="form-group">
                      <label className="form-label">Nome</label>
                      <input
                        type="text"
                        name="nomeFuncionario"
                        value={formData.nomeFuncionario || ''}
                        onChange={handleChange}
                        className="form-input"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Email</label>
                      <input
                        type="email"
                        name="emailFuncionario"
                        value={formData.emailFuncionario || ''}
                        onChange={handleChange}
                        className="form-input"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Telefone</label>
                      <input
                        type="tel"
                        name="telefoneFuncionario"
                        value={formData.telefoneFuncionario || ''}
                        onChange={handleChange}
                        className="form-input"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Morada</label>
                      <input
                        type="text"
                        name="moradaFuncionario"
                        value={formData.moradaFuncionario || ''}
                        onChange={handleChange}
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Nova Senha</label>
                      <input
                        type="password"
                        value={password}
                        onChange={handlePasswordChange}
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Confirmar Senha</label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={handleConfirmPasswordChange}
                        className="form-input"
                      />
                      {passwordError && (
                        <p className="form-error">
                          <svg className="error-icon-small" fill="currentColor" viewBox="0 0 20 20">
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
                    <div className="form-buttons">
                      <button type="button" onClick={handleCancel} className="cancel-button">
                        Cancelar
                      </button>
                      <button type="submit" className="submit-button" disabled={!!passwordError}>
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
      <svg className="info-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"
        />
      </svg>
    ),
    email: (
      <svg className="info-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
        />
      </svg>
    ),
    phone: (
      <svg className="info-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
        />
      </svg>
    ),
    location: (
      <svg className="info-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
    <div className={`info-field ${className}`}>
      {/*  <div className="info-icon-container">{icons[icon]}</div> */}
      <div className="info-text">
        <p className="info-label">{label}</p>
        <p className="info-value">{value}</p>
      </div>
    </div>
  );
}
