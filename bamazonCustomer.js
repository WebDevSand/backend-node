// CLA to keep track of inventory and to allow customers to choose a product, then update database

var mysql = require("mysql");
var inquirer = require("inquirer");

// connection data
var connection = mysql.createConnection({
  host: "localhost",
  port: 3306,
  user: "root",
  password: "test",
  database: "bamazon"
});

// connect to bamazon
connection.connect(function(err) {
  if (err) throw err;
  console.log("connected as id " + connection.threadId + "\n");
  readProducts();
});

// display products, then call purchase prompt function
function readProducts() {
  console.log("Displaying all products...\n");
  connection.query("SELECT * FROM products", function(err, res) {
    if (err) throw err;
    // log all products
    for (var i = 0; i < res.length; i++) {
      console.log("ID: " + res[i].id + "\nProduct Name: " + res[i].product_name + 
        "\nDepartment: " + res[i].department_name + "\nPrice: " + res[i].price + "\nAvailable Quantity: " + res[i].stock_quantity + "\n====================");
    }
    buyProducts(res);
  });
}
 
// purchase prompt, if product exists call quantity prompt function
function buyProducts(products) {
  inquirer.prompt([
    {
      type: "input",
      message: "Which product would you like to buy? (Enter product ID or e to exit application)",
      name: "productId",
      validate: function(res) {
        return !isNaN(res) || res.toLowerCase() === "e";
      }
    }    
  ]).then(function(res) {
    exitApplication(res.productId);

    var productId = parseInt(res.productId);
    var product = checkInventory(productId, products);
   
    // if product exists get quantity, else read products
    if (product) {
      getQuantity(product);
    } else {
      console.log("The item you have chosen does not exist.");
      readProducts();
    }    
  });
}

function checkInventory(id, products) {
  for (var i = 0; i < products.length; i++ ) {
    if (products[i].id === id) {
      return products[i];
    } 
  }
  // if product ID d.n.e.
  return null;
}

// prompt user for quantity 
function getQuantity(product) {
  inquirer.prompt([
    {
      type: "input",
      message: "How many would you like to buy? (Enter e to exit)",
      name: "productQuantity",
      validate: function(res) {
        return res > 0 || res.toLowerCase() === "e";
      }
    }
  ]).then(function(res) {
    exitApplication(res.productQuantity);

    var quantity = parseInt(res.productQuantity);

    // check if quantity is available
    if (quantity > product.stock_quantity) {
      console.log("We are sorry, but the quantity you have chosen is not available. You can buy a max of " + product.stock_quantity + " " + product.product_name + "(s).\n");
      readProducts();
    } else {
      updateStock(product, quantity);
    }
  });  
}

function updateStock(product, quantity) {
  var newQuantity = product.stock_quantity - quantity;
  connection.query("UPDATE products SET stock_quantity = ? WHERE id = ?", [newQuantity, product.id], function(err, res) {
    console.log("Your order of " + quantity + " " + product.product_name + "(s) has been placed successfully.\n");
    readProducts();
  });
}

function exitApplication(input) {
  if (input.toLowerCase() === "e") {
    console.log("Thanks for visiting our site.");
    process.exit(0);
  }
}
