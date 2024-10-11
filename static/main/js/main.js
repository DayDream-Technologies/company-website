const tst = document.querySelector('.menu_bar');
const dropdown = document.querySelector('.dropdown');
tst.addEventListener('click', event => {
    if (dropdown.style.display === 'none') {
        dropdown.style.display = 'grid';
        dropdown.style.gridTemplateColumns = '1fr';
        dropdown.style.gridTemplateRows = 'repeat(5, 50px)';
        dropdown.style.background = '#787d7a';
        dropdown.style.justifyItems = 'center';
        dropdown.style.alignItems = 'center';
        dropdown.style.width = '100%';
        dropdown.style.listStyleType = 'none';
        dropdown.style.position = 'fixed';
    }else{
        dropdown.style.display = 'none';
    }
})