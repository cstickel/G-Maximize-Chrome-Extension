$(document).ready(function () {
    if(localStorage["gplusmaximizeAutoinit"] == 1) $('#toggleAutoinit').addClass('active');

    $(document).on('click', '.switch', function () {
        $(this).toggleClass('active');
        $(this).trigger('change');
    });

    $('#toggleAutoinit').change(function () {
        localStorage["gplusmaximizeAutoinit"] = $(this).hasClass('active') ? 1 : 0;
    });
});