jQuery( document ).ready(function(){
  var imageLoader = document.getElementById('filePhoto');
  imageLoader.addEventListener('change', handleImage, false);

  function handleImage(e) {
      var reader = new FileReader();
      reader.onload = function (event) {
          $('.image').html( '<img src="'+event.target.result+'"/>' );
      }
      reader.readAsDataURL(e.target.files[0]);
  }
});
