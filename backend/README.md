# IIT Ropar Form Management Application 

## Backend URLs

### Forms

- Form Creation: /api/form/createForm
- Get all Forms: /api/form/getAllForms


### User
- Login: Next Auth Login feature: signup 


### Admin
- Member Registration: /api/admin/registerVerifier
    While Registering the role ensure that the role should be from this list and in this words: [Admin, Caretaker,HOD, Dean]
- Get All Members List: /api/admin/getAllMembers
- Get Particular Member Details: /api/admin/getVerifierMemberDetails/[userId]
