var app = (function () {
  'use strict'
  function t() {}
  function e(t) {
    return t()
  }
  function n() {
    return Object.create(null)
  }
  function o(t) {
    t.forEach(e)
  }
  function r(t) {
    return 'function' == typeof t
  }
  function l(t, e) {
    return t != t
      ? e == e
      : t !== e || (t && 'object' == typeof t) || 'function' == typeof t
  }
  function s(t) {
    return null == t ? '' : t
  }
  function c(t, e) {
    t.appendChild(e)
  }
  function i(t, e, n) {
    t.insertBefore(e, n || null)
  }
  function u(t) {
    t.parentNode.removeChild(t)
  }
  function f(t, e) {
    for (let n = 0; n < t.length; n += 1) t[n] && t[n].d(e)
  }
  function a(t) {
    return document.createElement(t)
  }
  function d(t) {
    return document.createTextNode(t)
  }
  function $() {
    return d(' ')
  }
  function p(t, e, n) {
    null == n
      ? t.removeAttribute(e)
      : t.getAttribute(e) !== n && t.setAttribute(e, n)
  }
  function g(t, e) {
    ;(e = '' + e), t.wholeText !== e && (t.data = e)
  }
  let h
  function m(t) {
    h = t
  }
  const b = [],
    y = [],
    v = [],
    x = [],
    _ = Promise.resolve()
  let k = !1
  function w(t) {
    v.push(t)
  }
  let S = !1
  const E = new Set()
  function T() {
    if (!S) {
      S = !0
      do {
        for (let t = 0; t < b.length; t += 1) {
          const e = b[t]
          m(e), j(e.$$)
        }
        for (m(null), b.length = 0; y.length; ) y.pop()()
        for (let t = 0; t < v.length; t += 1) {
          const e = v[t]
          E.has(e) || (E.add(e), e())
        }
        v.length = 0
      } while (b.length)
      for (; x.length; ) x.pop()()
      ;(k = !1), (S = !1), E.clear()
    }
  }
  function j(t) {
    if (null !== t.fragment) {
      t.update(), o(t.before_update)
      const e = t.dirty
      ;(t.dirty = [-1]),
        t.fragment && t.fragment.p(t.ctx, e),
        t.after_update.forEach(w)
    }
  }
  const A = new Set()
  function O(t, e) {
    t && t.i && (A.delete(t), t.i(e))
  }
  function N(t, e, n, o) {
    if (t && t.o) {
      if (A.has(t)) return
      A.add(t),
        undefined.c.push(() => {
          A.delete(t), o && (n && t.d(1), o())
        }),
        t.o(e)
    }
  }
  function q(t) {
    t && t.c()
  }
  function z(t, n, l, s) {
    const { fragment: c, on_mount: i, on_destroy: u, after_update: f } = t.$$
    c && c.m(n, l),
      s ||
        w(() => {
          const n = i.map(e).filter(r)
          u ? u.push(...n) : o(n), (t.$$.on_mount = [])
        }),
      f.forEach(w)
  }
  function C(t, e) {
    const n = t.$$
    null !== n.fragment &&
      (o(n.on_destroy),
      n.fragment && n.fragment.d(e),
      (n.on_destroy = n.fragment = null),
      (n.ctx = []))
  }
  function L(t, e) {
    ;-1 === t.$$.dirty[0] &&
      (b.push(t), k || ((k = !0), _.then(T)), t.$$.dirty.fill(0)),
      (t.$$.dirty[(e / 31) | 0] |= 1 << e % 31)
  }
  function B(e, r, l, s, c, i, f = [-1]) {
    const a = h
    m(e)
    const d = (e.$$ = {
      fragment: null,
      ctx: null,
      props: i,
      update: t,
      not_equal: c,
      bound: n(),
      on_mount: [],
      on_destroy: [],
      on_disconnect: [],
      before_update: [],
      after_update: [],
      context: new Map(a ? a.$$.context : r.context || []),
      callbacks: n(),
      dirty: f,
      skip_bound: !1,
    })
    let $ = !1
    if (
      ((d.ctx = l
        ? l(e, r.props || {}, (t, n, ...o) => {
            const r = o.length ? o[0] : n
            return (
              d.ctx &&
                c(d.ctx[t], (d.ctx[t] = r)) &&
                (!d.skip_bound && d.bound[t] && d.bound[t](r), $ && L(e, t)),
              n
            )
          })
        : []),
      d.update(),
      ($ = !0),
      o(d.before_update),
      (d.fragment = !!s && s(d.ctx)),
      r.target)
    ) {
      if (r.hydrate) {
        const t = (function (t) {
          return Array.from(t.childNodes)
        })(r.target)
        d.fragment && d.fragment.l(t), t.forEach(u)
      } else d.fragment && d.fragment.c()
      r.intro && O(e.$$.fragment),
        z(e, r.target, r.anchor, r.customElement),
        T()
    }
    m(a)
  }
  class I {
    $destroy() {
      C(this, 1), (this.$destroy = t)
    }
    $on(t, e) {
      const n = this.$$.callbacks[t] || (this.$$.callbacks[t] = [])
      return (
        n.push(e),
        () => {
          const t = n.indexOf(e)
          ;-1 !== t && n.splice(t, 1)
        }
      )
    }
    $set(t) {
      var e
      this.$$set &&
        ((e = t), 0 !== Object.keys(e).length) &&
        ((this.$$.skip_bound = !0), this.$$set(t), (this.$$.skip_bound = !1))
    }
  }
  function M(t, e, n) {
    const o = t.slice()
    return (o[5] = e[n]), o
  }
  function P(t) {
    let e,
      n,
      o,
      r,
      l,
      f = t[5] + ''
    function $() {
      return t[4](t[5])
    }
    return {
      c() {
        ;(e = a('div')),
          (n = d(f)),
          p(
            e,
            'class',
            (o = s(t[1] === t[5] ? 'tab selected' : 'tab') + ' svelte-18t8n6f')
          )
      },
      m(t, o) {
        var s, u, f, a
        i(t, e, o),
          c(e, n),
          r ||
            ((u = 'click'),
            (f = $),
            (s = e).addEventListener(u, f, a),
            (l = () => s.removeEventListener(u, f, a)),
            (r = !0))
      },
      p(r, l) {
        ;(t = r),
          1 & l && f !== (f = t[5] + '') && g(n, f),
          3 & l &&
            o !==
              (o =
                s(t[1] === t[5] ? 'tab selected' : 'tab') +
                ' svelte-18t8n6f') &&
            p(e, 'class', o)
      },
      d(t) {
        t && u(e), (r = !1), l()
      },
    }
  }
  function D(e) {
    let n,
      o,
      r,
      l,
      s,
      d = e[0],
      g = []
    for (let t = 0; t < d.length; t += 1) g[t] = P(M(e, d, t))
    return {
      c() {
        n = a('div')
        for (let t = 0; t < g.length; t += 1) g[t].c()
        ;(o = $()),
          (r = a('div')),
          p(r, 'class', 'bar svelte-18t8n6f'),
          p(
            r,
            'style',
            (l = `left:${e[3]}px;display:${e[3] < 0 ? 'none' : 'block'};`)
          ),
          p(n, 'class', 'wrap svelte-18t8n6f'),
          p(n, 'style', (s = `width:${101 * e[0].length}px`))
      },
      m(t, e) {
        i(t, n, e)
        for (let t = 0; t < g.length; t += 1) g[t].m(n, null)
        c(n, o), c(n, r)
      },
      p(t, [e]) {
        if (7 & e) {
          let r
          for (d = t[0], r = 0; r < d.length; r += 1) {
            const l = M(t, d, r)
            g[r] ? g[r].p(l, e) : ((g[r] = P(l)), g[r].c(), g[r].m(n, o))
          }
          for (; r < g.length; r += 1) g[r].d(1)
          g.length = d.length
        }
        8 & e &&
          l !==
            (l = `left:${t[3]}px;display:${t[3] < 0 ? 'none' : 'block'};`) &&
          p(r, 'style', l),
          1 & e &&
            s !== (s = `width:${101 * t[0].length}px`) &&
            p(n, 'style', s)
      },
      i: t,
      o: t,
      d(t) {
        t && u(n), f(g, t)
      },
    }
  }
  function F(t, e, n) {
    let o,
      { tabs: r = [] } = e,
      { selected: l = '' } = e,
      { onSelect: s = () => {} } = e
    return (
      (t.$$set = (t) => {
        'tabs' in t && n(0, (r = t.tabs)),
          'selected' in t && n(1, (l = t.selected)),
          'onSelect' in t && n(2, (s = t.onSelect))
      }),
      (t.$$.update = () => {
        3 & t.$$.dirty && n(3, (o = 101 * r.indexOf(l) + 1))
      }),
      [r, l, s, o, (t) => s(t)]
    )
  }
  class G extends I {
    constructor(t) {
      super(), B(this, t, F, D, l, { tabs: 0, selected: 1, onSelect: 2 })
    }
  }
  function H(t, e, n) {
    const o = t.slice()
    return (o[6] = e[n]), o
  }
  function J(t) {
    let e,
      n,
      o,
      r = t[6].text + ''
    return {
      c() {
        ;(e = a('span')),
          (n = d(r)),
          p(
            e,
            'style',
            (o = `color:${'error' === t[6].type ? 'red' : 'whitesmoke'};`)
          )
      },
      m(t, o) {
        i(t, e, o), c(e, n)
      },
      p(t, l) {
        4 & l && r !== (r = t[6].text + '') && g(n, r),
          4 & l &&
            o !==
              (o = `color:${'error' === t[6].type ? 'red' : 'whitesmoke'};`) &&
            p(e, 'style', o)
      },
      d(t) {
        t && u(e)
      },
    }
  }
  function K(t) {
    let e, n, o, r, l
    n = new G({ props: { tabs: t[0], selected: t[1], onSelect: t[3] } })
    let s = t[2],
      d = []
    for (let e = 0; e < s.length; e += 1) d[e] = J(H(t, s, e))
    return {
      c() {
        ;(e = a('section')), q(n.$$.fragment), (o = $()), (r = a('pre'))
        for (let t = 0; t < d.length; t += 1) d[t].c()
        p(r, 'class', 'svelte-21zv1k'), p(e, 'class', 'svelte-21zv1k')
      },
      m(t, s) {
        i(t, e, s), z(n, e, null), c(e, o), c(e, r)
        for (let t = 0; t < d.length; t += 1) d[t].m(r, null)
        l = !0
      },
      p(t, [e]) {
        const o = {}
        if (
          (1 & e && (o.tabs = t[0]),
          2 & e && (o.selected = t[1]),
          n.$set(o),
          4 & e)
        ) {
          let n
          for (s = t[2], n = 0; n < s.length; n += 1) {
            const o = H(t, s, n)
            d[n] ? d[n].p(o, e) : ((d[n] = J(o)), d[n].c(), d[n].m(r, null))
          }
          for (; n < d.length; n += 1) d[n].d(1)
          d.length = s.length
        }
      },
      i(t) {
        l || (O(n.$$.fragment, t), (l = !0))
      },
      o(t) {
        N(n.$$.fragment, t), (l = !1)
      },
      d(t) {
        t && u(e), C(n), f(d, t)
      },
    }
  }
  function Q(t, e, n) {
    let o,
      r,
      { nodes: l = [] } = e,
      { logs: s = {} } = e,
      { initialSelectedTab: c = '' } = e
    return (
      (t.$$set = (t) => {
        'nodes' in t && n(0, (l = t.nodes)),
          'logs' in t && n(4, (s = t.logs)),
          'initialSelectedTab' in t && n(5, (c = t.initialSelectedTab))
      }),
      (t.$$.update = () => {
        32 & t.$$.dirty && n(1, (o = c)),
          18 & t.$$.dirty && n(2, (r = s[o] ? s[o].reverse() : []))
      }),
      [
        l,
        o,
        r,
        function (t) {
          n(1, (o = t))
        },
        s,
        c,
      ]
    )
  }
  class R extends I {
    constructor(t) {
      super(), B(this, t, Q, K, l, { nodes: 0, logs: 4, initialSelectedTab: 5 })
    }
  }
  function U(t) {
    let e, n, o, r, l
    return (
      (n = new R({ props: { nodes: t[1], logs: t[0] } })),
      (r = new R({ props: { nodes: t[2], logs: t[0] } })),
      {
        c() {
          ;(e = a('main')),
            q(n.$$.fragment),
            (o = $()),
            q(r.$$.fragment),
            p(e, 'class', 'svelte-xfigi5')
        },
        m(t, s) {
          i(t, e, s), z(n, e, null), c(e, o), z(r, e, null), (l = !0)
        },
        p(t, [e]) {
          const o = {}
          1 & e && (o.logs = t[0]), n.$set(o)
          const l = {}
          1 & e && (l.logs = t[0]), r.$set(l)
        },
        i(t) {
          l || (O(n.$$.fragment, t), O(r.$$.fragment, t), (l = !0))
        },
        o(t) {
          N(n.$$.fragment, t), N(r.$$.fragment, t), (l = !1)
        },
        d(t) {
          t && u(e), C(n), C(r)
        },
      }
    )
  }
  function V(t, e, n) {
    let o
    setInterval(() => {
      fetch('http://localhost:3333/logs')
        .then((t) => t.json())
        .then((t) => {
          return (e = t), console.log(e), void n(0, (o = e))
          var e
        })
    }, 2e3)
    return (
      n(0, (o = {})),
      [
        o,
        ['alice', 'bob', 'carol', 'dave'],
        ['proxy', 'auth', 'mqtt', 'tribes', 'meme'],
      ]
    )
  }
  return new (class extends I {
    constructor(t) {
      super(), B(this, t, V, U, l, {})
    }
  })({ target: document.body })
})()
//# sourceMappingURL=bundle.js.map
