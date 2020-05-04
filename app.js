var express = require('express');
var app = express();
var mysql = require('mysql');
var bodyParser = require('body-parser');
var flash = require('express-flash');
var session = require('express-session');
var open = require('open');
app.use(session({
    cookie: {
        maxAge: 60000
    },
    store: new session.MemoryStore,
    saveUninitialized: true,
    resave: 'true',
    secret: 'secret'
}))
app.use(flash());


var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'gestion de stocks'
});



connection.connect(function (err) {
    if (err) throw err
    console.log('You are now connected with mysql database...')
})

app.use(bodyParser.json()); // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({ // to support URL-encoded bodies
    extended: true
}));


var server = app.listen(3000, "127.0.0.1", function () {
    var host = server.address().address
    var port = server.address().port
    console.log("Example app listening at http://%s:%s", host, port)
});




app.use(express.static(__dirname + '/public'));


app.set('view engine', 'ejs');



var obj = {};
app.get('/', function (req, rep) {
    connection.query('SELECT p.*, f.nomfour, r.categorie FROM produit p JOIN fournisseur f ON p.id_foun = f.id JOIN rayon r ON p.id_rayon = r.id', function (err, result) {
        if (err) {
            throw err;
        } else {
            obj = {
                produits: result
            };
            rep.render('produits', obj);
        }
    });
})

app.get('/addfourn', function (req, rep) {
    rep.render('addfourn');
})

app.get('/addcat', function (req, rep) {
    rep.render('addcat');
})

app.get('/fournisseur', function (req, rep) {
    connection.query('SELECT * FROM fournisseur', function (err, result) {
        if (err) {
            throw err;
        } else {
            obj = {
                fournisseurs: result
            };
            rep.render('fournisseur', obj);
        }
    });
})

app.get('/rayon', function (req, rep) {
    connection.query('SELECT * FROM rayon', function (err, result) {
        if (err) {
            throw err;
        } else {
            obj = {
                rayons: result
            };
            rep.render('rayon', obj);
        }
    });
})


app.get('/addprod', function (req, rep) {
    connection.query('SELECT nomfour FROM fournisseur', function (err, result) {
        if (err) {
            throw err;
        } else {
            obj = {
                fournisseurs: result
            };

            connection.query('SELECT categorie FROM rayon', function (err, result) {
                if (err) {
                    throw err;
                } else {
                    obj.rayons = result;
                    rep.render('addprod', obj);
                }
            });
        }
    });


})


open('http://127.0.0.1:3000/')

app.post('/addprod', function (req, res, next) {
    let id = null;
    let nom = req.body.nom;
    let quantite = req.body.quantite;
    let prix = req.body.prix;
    let fournisseur = req.body.four;
    let categorie = req.body.categ;
    let errors = false;


    if (nom.length === 0 || quantite.length === 0 || prix.length === 0) {
        errors = true;

        req.flash('error', "SVP entrer Nom, Quantité et le prix");
        res.redirect('/addprod');

    }


    if (!errors) {

        connection.query('SELECT id FROM fournisseur WHERE nomfour = ?', fournisseur, function (err, result) {
            if (err) {
                // throw err;

                req.flash('error', "SVP ajouter le Fournisseur et le Rayon");
               res.redirect('/');
                
            } else {

                fournisseur = result[0].id
                connection.query('SELECT id FROM rayon WHERE categorie= ?', categorie, function (err, result) {
                    if (err) {
                        // throw err;
                        req.flash('error', "SVP ajouter le Fournisseur et le Rayon");
                        res.redirect('/');
                    } else {

                        categorie = result[0].id

                        var form_produit = {
                            id: id,
                            nom: nom,
                            quantite: quantite,
                            prix: prix,
                            id_rayon: categorie,
                            id_foun: fournisseur
                        }
                        connection.query('INSERT INTO produit SET ?', form_produit, function (err, result) {
                            if (err) {
                                req.flash('error', err)
                                throw err;


                            } else {

                                req.flash('success', 'Produit ajouter en succeser !');
                                res.redirect('/');
                            }
                        })
                    }
                });
            }
        });
    }
})


app.post('/addfourn', function (req, res, next) {

    let id = null;
    let nomfour = req.body.nomfour;
    let mail = req.body.mail;
    let tele = req.body.tele;

    let errors = false;

    if (nomfour.length === 0 || mail.length === 0 || tele.length === 0) {
        errors = true;

        req.flash('error', "SVP entrer NOM, Email et Telephone");
        res.render('addfourn');

    }


    if (!errors) {

        var form_fourn = {
            id: id,
            nomfour: nomfour,
            mail: mail,
            tele: tele

        }
        connection.query('INSERT INTO fournisseur SET ?', form_fourn, function (err, result) {
            if (err) {
                req.flash('error', err)
                throw err;


            } else {

                req.flash('success', 'Fournisseur ajouter en succeser!');
                res.redirect('/addprod');
            }
        })
    }
})



app.post('/addcat', function (req, res, next) {

    let id = null;
    let categorie = req.body.categorie;


    let errors = false;

    if (categorie.length === 0) {
        errors = true;

        req.flash('error', "SVP entrer une Categorie");
        res.render('addcat');

    }


    if (!errors) {

        var form_cat = {
            id: id,
            categorie: categorie


        }
        connection.query('INSERT INTO rayon SET ?', form_cat, function (err, result) {
            if (err) {
                req.flash('error', err)
                throw err;


            } else {

                req.flash('success', 'Categorie ajouter en succeser!');
                res.redirect('/addprod');
            }
        })
    }
})



app.get('/updateproduct/:id', function (req, rep, next) {

    let id = req.params.id

    connection.query("SELECT * FROM produit WHERE id = '" + id + "' ", (err, result) => {
        if (!err) {

            rep.render('updateprod', {
                test: result
            })


        } else {
            rep.send(err)

        }
    })

})

app.post('/updateproduct/:id', (req, res) => {

    let id = req.params.id;
    let nom = req.body.nom;
    let quantite = req.body.quantite;
    let prix = req.body.prix;

    let errors = false;


    if (nom.length === 0 || quantite.length === 0 || prix.length === 0) {
        errors = true;

        req.flash('error', "SVP entrer nom , Quantité et le prix");
        res.redirect('/');

    }


    if (!errors) {

        connection.query("UPDATE produit SET nom = '" + nom + "', quantite = '" + quantite + "', prix = '" + prix + "' WHERE id = '" + id + "'", (err, result) => {
            if (!err) {
                res.redirect("/")
            } else {
                res.send(err)

            }

        })
    }
})



app.get('/updatedepartment/:id', function (req, res) {

    let depId = req.params.id

    connection.query("SELECT * FROM rayon WHERE id = '" + depId + "' ", (err, result) => {
        if (!err) {
            res.render('update department.ejs', {
                test: result
            })

        } else {
            res.send(err)
        }
    })

})

app.post('/updatedepartment/:id', (req, res) => {

    let id = req.params.id;
    let categorie = req.body.categorie;

    let errors = false;

    if (categorie.length === 0) {
        errors = true;

        req.flash('error', "SVP entrer nom de categorie");
        res.redirect('/rayon');

    }


    if (!errors) {

        connection.query("UPDATE rayon SET categorie = '" + categorie + "' WHERE id = '" + id + "'", (err, result) => {
            if (!err) {
                res.redirect("/rayon")
            } else {
                res.send(err)

            }

        })
    }

})



app.get('/updatefourni/:id', function (req, res) {

    let fourId = req.params.id

    connection.query("SELECT * FROM fournisseur WHERE id = '" + fourId + "' ", (err, result) => {
        if (!err) {
            res.render('update fournisseur.ejs', {
                test: result
            })

        } else {
            res.send(err)
        }
    })

})

app.post('/updatefourni/:id', (req, res) => {

    let id = req.params.id;
    let nomfour = req.body.nomfour;
    let mail = req.body.mail;
    let tele = req.body.tele;

    let errors = false;

    if (nomfour.length === 0 || mail.length === 0 || tele.length === 0) {
        errors = true;

        req.flash('error', "SVP entrer nom, email, telephone");
        res.redirect('/fournisseur');

    }


    if (!errors) {

        connection.query("UPDATE fournisseur SET nomfour = '" + nomfour + "', mail = '" + mail + "', tele = '" + tele + "' WHERE id = '" + id + "'", (err, result) => {
            if (!err) {
                res.redirect("/fournisseur")
            } else {
                res.send(err)

            }

        })
    }

})




//////////////////////////////////////////////////////////////////////////////////////::

app.get('/deletequantite/:id', function (req, rep, next) {

    let id = req.params.id
    connection.query("UPDATE produit SET quantite = quantite - 1 WHERE id = ?", id, (err, result) => {
        if (!err) {

            req.flash('success', 'Quantité dimunier en succeser')
            rep.redirect('/')


        } else {

            rep.send(err)
            req.flash('error', err)


        }
    })

})














app.get('/delete/(:id)', function (req, res, next) {
    let id = req.params.id;
    connection.query('DELETE FROM produit WHERE id = ' + id, function (err, result) {
        if (err) {
            req.flash('error', err)
            res.redirect('/')
        } else {
            req.flash('success', 'produit est supprimer! ID = ' + id)
            res.redirect('/')
        }
    })
})

app.get('/delete/four/(:id)', function (req, res, next) {
    let id = req.params.id;
    connection.query('DELETE FROM fournisseur WHERE id = ' + id, function (err, result) {
        if (err) {
            req.flash('error', 'Products exists in this department')
            res.redirect('/fournisseur')
        } else {
            req.flash('success', 'Fournisseur  est supprimer!  ID = ' + id)
            res.redirect('/fournisseur')
        }
    })
})

app.get('/delete/cat/(:id)', function (req, res, next) {
    let id = req.params.id;
    connection.query('DELETE FROM rayon WHERE id = ' + id, function (err, result) {
        if (err) {
            req.flash('error', 'produit est deja existe dans ce department')
            res.redirect('/rayon')
        } else {
            req.flash('success', 'categorie  est supprimer!  ID = ' + id)
            res.redirect('/rayon')
        }
    })
})





app.listen(3000, function () {
    console.log('our server is live on port 3000');
})