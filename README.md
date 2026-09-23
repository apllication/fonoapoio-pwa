# FonoApoio UBS

Projeto PWA sem fins lucrativos para apoiar a relação entre **criança e fonoaudióloga**, especialmente em contextos com poucos recursos.

## Princípios

- Não diagnosticar.
- Não substituir avaliação, atendimento ou decisão clínica da profissional.
- Priorizar evidências, revisão profissional, acessibilidade e privacidade.
- Não usar dados reais de crianças durante o desenvolvimento inicial.
- Desenvolver offline-first para contextos de conectividade limitada.
- Não vender dados e não usar publicidade direcionada a crianças.

## Estado atual

A primeira versão funciona como demonstração local:

- Minha Jornada.
- Área da Fonoaudióloga.
- Cadastro demonstrativo de crianças.
- Jornadas de atividades.
- Gravação e reprodução de voz.
- Transcrição automática quando o navegador oferece esse recurso.
- Histórico de tentativas e observações da fono.
- Dados ainda ficam somente na memória da sessão.

## Próxima etapa iniciada: segurança e persistência

A base do backend foi preparada para uma futura conexão com Firebase:

- `firebase-config.example.js`: modelo de configuração do aplicativo web.
- `firestore.rules`: regras para separar dados por profissional.
- `storage.rules`: regras para proteger arquivos de voz e limitar o tipo/tamanho do áudio.
- Modelo previsto: profissional → crianças → jornadas, observações e registros de voz.

**Importante:** essas regras são uma base de arquitetura e devem ser testadas no Firebase Emulator/ambiente de homologação antes de qualquer uso real com crianças.

### Estrutura prevista

```
users/{professionalId}
children/{childId}
children/{childId}/journeys/{journeyId}
children/{childId}/observations/{observationId}
children/{childId}/voiceRecords/{recordId}
professionals/{professionalId}/children/{childId}/voice/{fileName}
```

## Configuração do Firebase

1. Criar um projeto Firebase separado para desenvolvimento.
2. Ativar Authentication, inicialmente com conta de profissional.
3. Criar Firestore Database.
4. Criar Storage.
5. Copiar a configuração do aplicativo web para `firebase-config.js`.
6. Publicar as regras de `firestore.rules` e `storage.rules`.
7. Testar primeiro com dados fictícios.
8. Somente depois desenhar o fluxo de consentimento, retenção, exclusão e uso de dados reais.

A configuração web do Firebase pode ficar no frontend; **senhas, service accounts e chaves privadas nunca devem ser colocadas no repositório**.

## Conteúdo clínico

Cada atividade assistencial deverá ter objetivo, faixa etária, instruções, referência, responsável pela revisão e data da última revisão.

Conteúdo clínico deve passar por revisão de profissional habilitado antes de uso assistencial.

## Desenvolvimento

Antes de um piloto em UBS, recomenda-se validação técnica, revisão profissional, testes de acessibilidade, teste de segurança e piloto controlado com dados fictícios.
