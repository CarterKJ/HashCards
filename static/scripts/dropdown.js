var opened = false

$('#dropdown-toggle').click(function(event) {
    if (opened) {
        opened = false;
        $('#options').removeClass('opened');
        $('#dropdown-toggle').removeClass('opened');
    }
    else {
        opened = true;
        $('#options').addClass('opened');
        $('#dropdown-toggle').addClass('opened');
    }
})
