let restaurant;
var map;

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
	fetchRestaurantFromURL((error, restaurant) => {
		if (error) { // Got an error!
			console.error(error);
		} else {
			self.map = new google.maps.Map(document.getElementById('map'), {
				zoom: 16,
				center: restaurant.latlng,
				scrollwheel: false
			});
			fillBreadcrumb();
			DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
		}
	});
}

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
	if (self.restaurant) { // restaurant already fetched!
		callback(null, self.restaurant)
		return;
	}
	const id = getParameterByName('id');
	if (!id) { // no id found in URL
		error = 'No restaurant id in URL'
		callback(error, null);
	} else {
		DBHelper.fetchRestaurantById(id, (error, restaurant) => {
			self.restaurant = restaurant;
			if (!restaurant) {
				console.error(error);
				return;
			}
			DBHelper.fetchRestaurantReviews(self.restaurant, (error, reviews) => {
				self.restaurant.reviews = reviews;
				if (!reviews) {
					console.error(error);
				}
				fillRestaurantHTML();
				callback(null, restaurant)
			});
		});
	}
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
	const name = document.getElementById('restaurant-name');
	name.innerHTML = restaurant.name;
	name.setAttribute('tabindex', 0);
	
	const favCheck = document.getElementById('favCheck');
	favCheck.checked = restaurant.is_favorite;
	favCheck.addEventListener('change', event => {
		DBHelper.toggleFavorite(restaurant, event.target.checked);
	});

	const address = document.getElementById('restaurant-address');
	address.innerHTML = restaurant.address;
	address.setAttribute('tabindex', 0);

	const image = document.getElementById('restaurant-img');
	image.className = 'restaurant-img'
	image.src = DBHelper.imageUrlForRestaurant(restaurant);
	image.setAttribute('alt', restaurant.name);
	image.setAttribute('alt', `An image of ${restaurant.name}`);
	image.setAttribute('tabindex', 0);

	const cuisine = document.getElementById('restaurant-cuisine');
	cuisine.innerHTML = restaurant.cuisine_type;
	cuisine.setAttribute('tabindex', 0);

	// fill operating hours
	if (restaurant.operating_hours) {
		fillRestaurantHoursHTML();
	}
	// fill reviews
	fillReviewsHTML();
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
	const hours = document.getElementById('restaurant-hours');
	for (let key in operatingHours) {
		const row = document.createElement('tr');

		const day = document.createElement('td');
		day.innerHTML = key;
		day.setAttribute('tabindex', 0);
		row.appendChild(day);

		const time = document.createElement('td');
		time.innerHTML = operatingHours[key];
		time.setAttribute('tabindex', 0);
		row.appendChild(time);

		hours.appendChild(row);
	}
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.restaurant.reviews) => {
	const container = document.getElementById('reviews-container');
	const title = document.createElement('h3');
	title.innerHTML = 'Reviews';
	title.setAttribute('tabindex', 0);
	container.prepend(title);
	
	if (!reviews) {
		const noReviews = document.createElement('p');
		noReviews.innerHTML = 'No reviews yet!';
		noReviews.setAttribute('tabindex', 0);
		container.appendChild(noReviews);
		return;
	}
	const ul = document.getElementById('reviews-list');
	reviews.forEach(review => {
		ul.appendChild(createReviewHTML(review));
	});
}

/**
 * Create review HTML and add it to the webpage.
 */

createReviewHTML = (review) => {
	const li = document.createElement('li');
	const name = document.createElement('p');
	name.innerHTML = review.name;
	name.setAttribute('tabindex', 0);
	li.appendChild(name);
	const date = document.createElement('p');	
	date.innerHTML = new Date(review.updatedAt).toDateString();
	date.setAttribute('tabindex', 0);
	li.appendChild(date);
	const rating = document.createElement('p');
	rating.innerHTML = `Rating: ${review.rating}`;
	rating.setAttribute('tabindex', 0);
	li.appendChild(rating);

	
	
	const reviewDelete = document.createElement("span");
	reviewDelete.setAttribute("id", review.id);
	reviewDelete.setAttribute("class", "delete");
	reviewDelete.innerHTML = "<i class='fas fa-trash'></i></br></br>";
	reviewDelete.onclick = deleteItem;
	li.appendChild(reviewDelete);
	reviewDelete.classList.add('trush');
	
	function deleteItem(e) {
		reviewDelete.addEventListener('click',function(){
		this.parentNode.remove();
		console.log("delete an item: " + id);
		});	
			
	}
	


	const editBtn= document.createElement("p");
	editBtn.innerHTML = "<i style='margin-left:-10px; padding-right:57px; 'class='fas fa-pen-square'></i>";
	editBtn.setAttribute("id", review.editBtn);
	li.appendChild(editBtn);
	editBtn.classList.add('edit');

	editBtn.addEventListener('click', function(e) {
	  if (!comments.isContentEditable) {
		comments.contentEditable = 'true';
		editBtn.innerHTML = "<a style='font-size:15px; margin-left:-10px; color:green; width:100px; padding-right:57px; background-color:white;'>Save</a>";	
	  } 
	  else{
		// Disable Editing
		comments.contentEditable = 'false';
		// Change Button Text and Color
		editBtn.innerHTML = "<i style='margin-left:-10px; padding-right:57px; 'class='fas fa-pen-square'></i>";

		// Save the data in localStorage 
		for (var i = 0; i < comments.length; i++) {
		  localStorage.setItem(editables[i].getAttribute('id'), editables[i].innerHTML);
		}
	  }



	});


	
	const comments = document.createElement('p');
	comments.innerHTML = review.comments;
	comments.setAttribute('tabindex', 0);
	comments.setAttribute('id', review.content);
	li.appendChild(comments);
	comments.classList.add('customer-review');






	return li;
}





const form = document.getElementById("reviewForm");
form.addEventListener("submit", function (event) {
	event.preventDefault();
	let review = {"restaurant_id": self.restaurant.id};
	const formdata = new FormData(form);
	for (var [key, value] of formdata.entries()) {
		review[key] = value;
	}
	DBHelper.submitReview(review)
		.then(data => {
			const ul = document.getElementById('reviews-list');
			ul.appendChild(createReviewHTML(review));
			form.reset();
		})
		.catch(error => console.error(error))
});



/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
	const breadcrumb = document.getElementById('breadcrumb');
	const li = document.createElement('li');
	li.innerHTML = restaurant.name;
	li.setAttribute('aria-current', 'page');
	breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
	if (!url)
		url = window.location.href;
	name = name.replace(/[\[\]]/g, '\\$&');
	const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
		results = regex.exec(url);
	if (!results)
		return null;
	if (!results[2])
		return '';
	return decodeURIComponent(results[2].replace(/\+/g, ' '));
}
