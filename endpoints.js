const Users = require("./models/Users");
const { body, validationResult } = require("express-validator");
const authMiddleware = require("./authMiddleware");
const { APP_SECRET, blackList } = require("./config");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const webSocketHandler = require("./webSocketHandler");
const axios = require("axios");
const client = new webSocketHandler();
client.connect();

module.exports = function (app) {
  app.post(
    "/users",
    body("email").isEmail(),
    body("username").isString(),
    body("username").isLength(4),
    body("password").isString(),
    body("password").isStrongPassword(),
    async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({
            message: "Alguno de los valores fue invalido",
            success: false,
            errors: errors.array(),
          });
        }
        const { email, username } = req.body;

        const oldEmail = await Users.findOne({ email });
        if (oldEmail) {
          return res.status(500).json({
            success: false,
            message: "Este email ya esta registrado",
          });
        }
        const password = await bcrypt.hash(req.body.password, 12);

        const user = new Users({
          email: email.toLowerCase(),
          username,
          password,
          active: false,
        });

        const result = await user.save();
        return res.status(200).json({
          id: result._id,
          message: "El usuario ha sido creado",
          success: true,
        });
      } catch (err) {
        return res.status(500).json({
          message: err.toString(),
          success: false,
        });
      }
    }
  );
  app.post("/authorization", async (req, res) => {
    try {
      const { password, email } = req.body;

      const user = await Users.findOne({ email });

      if (!user) {
        return res.status(500).json({
          message: "Ningun usuario se ha registrado con este correo",
          success: false,
        });
      }

      let isMatch = await bcrypt.compare(password, user.password);
      if (isMatch) {
        // Sign in the token and issue it to the user
        let token = jwt.sign(
          {
            user_id: user._id,
          },
          APP_SECRET,
          { expiresIn: "7 days" }
        );

        let result = {
          user_id: user._id,
          token: token,
          expiresIn: "7 days",
        };
        return res.status(200).json({
          ...result,
          message: "Has iniciado sesión.",
          success: true,
        });
      } else {
        return res.status(403).json({
          message: "contraseña incorrecta.",
          success: false,
        });
      }
    } catch (err) {
      return res.status(500).json({
        message: err.toString(),
        success: false,
      });
    }
  });
  app.delete("/authorization", authMiddleware, async (req, res) => {
    try {
      const authHeader = req.headers["authorization"];
      const token = authHeader && authHeader.split(" ")[1];
      blackList.push(token);
      req.headers["authorization"] = null;
      return res.status(200).json({
        message: "Se ha cerrado sesión",
        success: true,
      });
    } catch (err) {
      console.log(err);
      return res.status(500).json({
        code: errorCode,
        msg: {
          error: err.toString(),
        },
      });
    }
  });
  app.patch("/users/:id/active", authMiddleware, async (req, res) => {
    try {
      const id = req.params.id;
      if (!id) {
        return res.status(500).json({
          message: "No se ha introducido el id de ningun usuario",
          success: false,
        });
      }
      const user = await Users.findById(id);

      if (!user) {
        return res.status(500).json({
          message: "No se ha encontrado un usuario",
          success: false,
        });
      }

      if (req.user.user_id != user._id) {
        return res.status(500).json({
          message: "El id del usuario no coincide",
          success: false,
        });
      }
      if (user.active) {
        return res.status(500).json({
          message: "El usuario ya esta activo",
          success: false,
        });
      }
      user.active = true;

      await user.save();

      return res.status(200).json({
        message: "Usuario activo",
        success: true,
      });
    } catch (err) {
      console.log(err);
      return res.status(500).json({
        code: errorCode,
        msg: {
          error: err.toString(),
        },
      });
    }
  });
  app.get("/users/:id", authMiddleware, async (req, res) => {
    const id = req.params.id;
    if (!id) {
      return res.status(500).json({
        message: "No se ha introducido el id de ningun usuario",
        success: false,
      });
    }
    const user = await Users.findById(id);
    if (!user) {
      return res.status(500).json({
        message: "No se ha encontrado un usuario",
        success: false,
      });
    }
    if (req.user.user_id != user._id) {
      return res.status(500).json({
        message: "El id del usuario no coincide",
        success: false,
      });
    }
    if (!user.active) {
      return res.status(500).json({
        message: "El usuario no esta activo",
        success: false,
      });
    }
    return res.status(200).json({
      ...user._doc,
      password: null,
      success: true,
    });
  });
  app.put(
    "/users/:id",
    authMiddleware,
    body("email").isEmail(),
    body("username").isString(),
    body("username").isLength(4),
    body("password").isString(),
    body("password").isStrongPassword(),
    async (req, res) => {
      try {
        const id = req.params.id;
        if (!id) {
          return res.status(500).json({
            message: "No se ha introducido el id de ningun usuario",
            success: false,
          });
        }
        const errors = validationResult(req);
        const someErrors = errors.errors.map((err) => err.param);
        const user = await Users.findById(id);
        const mainErrors = {};

        if (req.user.user_id != user._id) {
          return res.status(500).json({
            message: "El id del usuario no coincide",
            success: false,
          });
        }

        const { email, username } = req.body;
        if (email && email !== "") {
          if (!someErrors.includes("email")) {
            const oldEmail = await Users.findOne({ email });
            if (oldEmail) {
              return res.status(500).json({
                success: false,
                message: "Este email ya esta registrado",
              });
            }
            user.email = email;
          } else {
            mainErrors.email = "Email invalido";
          }
        }
        if (username && username !== "") {
          if (!someErrors.includes("username")) {
            user.username = username;
          } else {
            mainErrors.username = "Usuario invalido";
          }
        }
        if (req.body.password && req.body.password !== "") {
          if (!someErrors.includes("password")) {
            user.password = await bcrypt.hash(req.body.password, 12);
          } else {
            mainErrors.password = "Contraseña invalida";
          }
        }
        const result = await user.save();
        return res.status(200).json({
          id: result._id,
          message: "El usuario ha sido actualizado",
          errores: { ...mainErrors },
          success: true,
        });
      } catch (err) {
        return res.status(500).json({
          message: err.toString(),
          success: false,
        });
      }
    }
  );
  app.delete("/users/:id", authMiddleware, async (req, res) => {
    try {
      const id = req.params.id;
      if (!id) {
        return res.status(500).json({
          message: "No se ha introducido el id de ningun usuario",
          success: false,
        });
      }
      const user = await Users.findById(id);
      if (!user) {
        return res.status(500).json({
          message: "No se ha encontrado un usuario",
          success: false,
        });
      }
      if (req.user.user_id != user._id) {
        return res.status(500).json({
          message: "El id del usuario no coincide",
          success: false,
        });
      }
      await user.delete();
      return res.status(200).json({
        message: "Ha sido eliminado exitosamente",
        success: true,
      });
    } catch (err) {
      return res.status(500).json({
        message: err.toString(),
        success: false,
      });
    }
  });
  app.post("/messages/send", authMiddleware, async (req, res) => {
    try {
      let result;
      axios
        .get("https://catfact.ninja/fact")
        .then((response) => {
          if (response.status === 200) {
            return response
          }
          throw response;
        })
        .then((data) => {
          result = data.data
          client.sendMessage(result.fact.toString(), req.user.user_id.toString());
          
        })
        .catch(function (error) {
          console.log(error)
        })
        .finally(function () {
          return res.status(200).json({
            result,
            message: "Mensaje enviado exitosamente",
            success: true,
          });
        });
    } catch (err) {
      return res.status(500).json({
        message: err.toString(),
        success: false,
      });
    }
  });
};
