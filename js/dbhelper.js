/**
 * Common database helper functions.
 */
const APP_URL = 'http://localhost:1337';// Change this according to your configuration
const RESTAURANT_LIST_OBJ_STORE = 'restaurantList';
const RESTAURANT_REVIEWS_OBJ_STORE = 'restaurantReviews';
const RESTAURANT_REVIEWS_OFFLINE_OBJ_STORE = 'restaurantReviewsOffline';
class DBHelper {

  /**
   * Database URL.
   * Function will return URL to fetch restaurant data
   */
  static get DATABASE_URL() {
    return `${APP_URL}/restaurants`;
  }
  
   /**
   * @description
   * This function will return URL to fetch restaurant reviews.
   */
  static get REVIEWS_URL() {
    return `${APP_URL}/reviews`;
  }
    /**
   * @description
   * This function will return URL to fetch restaurant reviews by restaurant Id.
   */
  static get REVIEWS_BY_ID_URL() {
    return `${APP_URL}/reviews?restaurant_id=`;
  }
/**
   * @description
   * This function will create object store name 'restaurantList' inside
   * 'restaurant-reviews' db and stores promise in a dbPromise variable
   */
  static initIDB() {
    this.dbPromise = idb.open('restaurant-reviews', 1, function (upgradeDb) {
      var restaurantListStore = upgradeDb.createObjectStore('RESTAURANT_LIST_OBJ_STORE', {
        keyPath: 'id'
      });
      restaurantListStore.createIndex('ids', 'id');
     
	 var reviewsStore = upgradeDb.createObjectStore(RESTAURANT_REVIEWS_OBJ_STORE, {
        keyPath: 'id' //primary key for stored obj.
      });
      
      reviewsStore.createIndex('restaurantId', 'restaurant_id');
      
	  var offlineStore = upgradeDb.createObjectStore(RESTAURANT_REVIEWS_OFFLINE_OBJ_STORE, {
        keyPath: 'updatedAt' //updatedAt would be the primary key for stored object.
    });
});
  }

  /**
   * @description
   * This function will return all the restaurant data from indexedDB.
   */
  static getRestaurantsDataFromIDBCache() {
    return this.dbPromise.then(db => {
      var tx = db.transaction(RESTAURANT_LIST_OBJ_STORE);
	  var restaurantListStore = tx.objectStore(RESTAURANT_LIST_OBJ_STORE);
      return restaurantListStore.getAll();
//var reviewsStore = tx.objectStore('restaurantReviews');
  //    return reviewsStore.getAll();
    })
  }
  
  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
	  var self = this;
     DBHelper.getRestaurantsDataFromIDBCache().then(restaurants => {
      /**
       * Check if restaurant data is already cached in Indexed DB.
       */
      if (restaurants.length > 0) {
        callback(null, restaurants);
	  }else {
		  /**
         * If data is not cached then make a network request.
         */
	  //Change from XHR To Fetch API
    fetch(DBHelper.DATABASE_URL)
    .then(response => {
          //If request is unsuccessfull then throw error.
          if (!response.ok) {
            throw new Error(response.statusText);
          }
		  //convert data in response received from server to json.
          return response.json();
	})
    .then(restaurants => {
          //processing the json data sent from the previous callback function.
          DBHelper.saveDataToIDB(restaurants,RESTAURANT_LIST_OBJ_STORE);
          callback(null, restaurants);
         }).catch(error => {
          callback(error, null);
    });
  }
	 });
 }
 /**
     * @description This method will save restaurant data to IDB
     * @param {string} restaurants - Array of objects to save
	 *@param{string} storeName- Name of the store to save  object into.
     */
    static saveDataToIDB(data, storeName) {
		
		return this.dbPromise.then(db => {
       if (!db) {
        return;
      }
       switch (storeName) {
      case RESTAURANT_LIST_OBJ_STORE:
	  var tx = db.transaction(storeName, "readwrite");
	  const restaurantListStore = tx.objectStore(storeName);
          data.forEach(restaurant => {
			  
		  restaurantListStore.put(restaurant);
          
        });
		return tx.complete;
     
	 case RESTAURANT_REVIEWS_OBJ_STORE:
          var tx = db.transaction(storeName, "readwrite");
          const reviewsStore = tx.objectStore(storeName);
          reviewsStore.put(data);
          return tx.complete;
		  
	 case RESTAURANT_REVIEWS_OFFLINE_OBJ_STORE:
          var tx = db.transaction(storeName, "readwrite");
          const offlineStore = tx.objectStore(storeName);
          offlineStore.put(data);
          return tx.complete;
      }
    });
  }


  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id,callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`/restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return (`dist/img/${restaurant.photograph}.webp`);
  }

  /**
   * Map marker for a restaurant.
   */
   static mapMarkerForRestaurant(restaurant, map) {
	   //Changing map marker color to Red from blue
	   const redIcon = new L.Icon({
      iconUrl: './img/marker-icon-2x-red.png',
      shadowUrl: './img/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
    // https://leafletjs.com/reference-1.3.0.html#marker  
    let marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng],
      {
	   icon:redIcon,
	   title: restaurant.name,
       alt: restaurant.name,
       url: DBHelper.urlForRestaurant(restaurant)
      })
      marker.addTo(newMap);
    return marker;
  } 
  /**
   * @description
   * This function will return all the reviews for a particular restaurant from indexedDB.
   */
  static getReviewsFromIDBCache(restaurantId) {
    return this.dbPromise.then(db => {
      var tx = db.transaction(RESTAURANT_REVIEWS_OBJ_STORE);
      var reviewsStore = tx.objectStore(RESTAURANT_REVIEWS_OBJ_STORE);
      return reviewsStore.index('restaurantId').getAll(parseInt(restaurantId));
    });
  }
  /**
   * @description
   * Fetch restaurant reviews.
   * @param {function} callback
   */
  static fetchReviews(callback) {
    /**
     * If data is not cached then make a network request.
     */
    fetch(DBHelper.REVIEWS_URL).then(response => {
      //If request is unsuccessfull then throw error.
      if (!response.ok) {
        throw new Error(response.statusText);
      }
      //convert data in response received from server to json.
      return response.json();
     }).then(reviews => {
      // DBHelper.saveDataToIDB(reviews,RESTAURANT_REVIEWS_OBJ_STORE);
      callback(null, reviews);
     }).catch(error => {
      callback(error, null);
    });
  }
  /**
   * @description
   * Fetch restaurant reviews by id.
   * @param {string} restaurantID
   * @param {function} callback
   */
  static fetchReviewsById(restaurantID, callback) {
	   var self = this;
	   DBHelper.getReviewsFromIDBCache(restaurantID).then(reviews => {
      /**
       * Check if reviews are already cached in Indexed DB.
       */
      if (reviews.length > 0) {
        callback(null, reviews);
       } else {
    /**
     * If data is not cached then make a network request.
     */
    fetch(`${DBHelper.REVIEWS_BY_ID_URL}${restaurantID}`).then(response => {
      //If request is unsuccessfull then throw error.
      if (!response.ok) {
        throw new Error(response.statusText);
      }
      //convert data in response received from server to json.
      return response.json();
     }).then(reviews => {
     // DBHelper.addReviewsToIDB(reviews);
	 reviews.forEach(review=>{
		 DBHelper.saveDataToIDB(review,RESTAURANT_REVIEWS_OBJ_STORE);
      
	 });
	  callback(null, reviews);
     }).catch(error => {
      callback(error, null);
	  });
	   }
 });
  
}
/* /**
   * @description This method will add reviews to IDB
   * @param {string} reviews - Array of reviews
   */
 /*  static addReviewsToIDB(reviews) {
    var self = this;
    reviews.forEach(review => {
      self.dbPromise.then(db => {
        var tx = db.transaction(RESTAURANT_REVIEWS_OBJ_STORE, 'readwrite');
        var reviewsStore = tx.objectStore(RESTAURANT_REVIEWS_OBJ_STORE);
        reviewsStore.put(review);
        return tx.complete;
      });
    }); */ 
	static submitReview(reviewObject) {
     return fetch(DBHelper.REVIEWS_URL, {
      body: JSON.stringify(reviewObject),
      headers: {
        'Content-Type': 'application/json'
      },
      method: "POST"
     }).then(response => {
      response.json().then(data => {
        DBHelper.saveDataToIDB(data, RESTAURANT_REVIEWS_OBJ_STORE);
        return data;
      })
      // console.log('error');
    }).catch(error => {
		
		 /**
       * User is offline, add an updatedAt and createdAt
       * property to the review object and store it in the IDB.
			 */
	  reviewObject.createdAt = new Date().getTime();
      reviewObject.updatedAt = new Date().getTime();	 
      DBHelper.saveDataToIDB(reviewObject, RESTAURANT_REVIEWS_OFFLINE_OBJ_STORE);
	});
  }

  }


